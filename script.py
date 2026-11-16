# ==============================================================================
# TAHAP 2: TRAINING & EVALUASI MODEL MURNI (TANPA LEKSIKON / TANPA SHORTCUT)
# Dashboard Analisis Sentimen Opini Publik Program Makan Bergizi Gratis (MBG)
# Metode: Pure FastText Subword Embedding & Bidirectional LSTM (BiLSTM)
# ==============================================================================

import argparse
import json
import os
import pickle
import sqlite3
from dataclasses import dataclass

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.layers import (
    Bidirectional,
    Concatenate,
    Dense,
    Dropout,
    Embedding,
    GlobalAveragePooling1D,
    GlobalMaxPooling1D,
    Input,
    LSTM,
    SpatialDropout1D,
)
from tensorflow.keras.models import Model, load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import Tokenizer

from text_preprocessing import ID_TO_LABEL, LABEL_MAPPING, clean_text

try:
    from gensim.models import FastText
    GENSIM_AVAILABLE = True
except ImportError:
    GENSIM_AVAILABLE = False


# ==============================================================================
# 1. KONFIGURASI GLOBAL
# ==============================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
ARTIFACTS_DIR = os.path.join(BASE_DIR, 'artifacts')
os.makedirs(ARTIFACTS_DIR, exist_ok=True)


@dataclass(frozen=True)
class Config:
    dataset_dir: str = os.path.join(BASE_DIR, 'sentimen mbg dataset')
    labeled_dataset_path: str = os.path.join(BASE_DIR, 'sentimen mbg dataset', 'dataset_labeled.csv')
    artifacts_dir: str = ARTIFACTS_DIR
    model_path: str = os.path.join(ARTIFACTS_DIR, 'model_sentimen_mbg.keras')
    tokenizer_path: str = os.path.join(ARTIFACTS_DIR, 'tokenizer.pkl')
    dashboard_csv_path: str = os.path.join(ARTIFACTS_DIR, 'comments_dashboard.csv')
    dashboard_db_path: str = os.path.join(ARTIFACTS_DIR, 'dashboard_mbg.db')
    metrics_json_path: str = os.path.join(ARTIFACTS_DIR, 'model_metrics.json')
    history_plot_path: str = os.path.join(ARTIFACTS_DIR, 'training_history.png')
    cm_plot_path: str = os.path.join(ARTIFACTS_DIR, 'confusion_matrix.png')

    vocab_size: int = 30000
    embedding_dim: int = 128
    max_len: int = 80
    bilstm_units: int = 128
    spatial_dropout: float = 0.20
    dropout_rate: float = 0.30
    num_classes: int = 3
    batch_size: int = 32
    epochs: int = 15
    learning_rate: float = 1e-3
    random_state: int = 42


CFG = Config()


# ==============================================================================
# 2. LOAD DATASET BERLABEL & PREPROCESSING NETRAL
# ==============================================================================
def load_labeled_dataset(dataset_path: str = CFG.labeled_dataset_path) -> pd.DataFrame:
    """
    Memuat dataset yang sudah memiliki label (`dataset_labeled.csv`), lalu membersihkan
    kolom `comment_asli` secara netral tanpa aturan kamus/leksikon.
    """
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(
            f"File dataset berlabel tidak ditemukan di: {dataset_path}\n"
            "Jalankan tahap pelabelan terlebih dahulu: `python label_dataset.py`"
        )

    print("=" * 70)
    print("1. LOAD DATASET BERLABEL & PREPROCESSING NETRAL (TANPA KAMUS)")
    print("=" * 70)
    print(f"Sumber dataset berlabel : {dataset_path}")

    df = pd.read_csv(dataset_path)

    # Dukung variasi nama kolom teks & label agar kompatibel dengan hasil pelabelan AI/manual
    if 'comment_asli' not in df.columns:
        for alt in ('comment', 'komentar', 'text', 'teks'):
            if alt in df.columns:
                df['comment_asli'] = df[alt]
                break
    if 'comment_asli' not in df.columns:
        raise ValueError("Dataset berlabel wajib memiliki kolom 'comment_asli' (atau 'comment').")

    if 'sentiment_label' not in df.columns:
        if 'label' in df.columns and df['label'].isin(ID_TO_LABEL).all():
            df['sentiment_label'] = df['label'].map(ID_TO_LABEL)
        else:
            raise ValueError("Dataset berlabel wajib memiliki kolom 'sentiment_label' (Positif/Netral/Negatif).")

    df = df.dropna(subset=['comment_asli', 'sentiment_label']).copy()
    df['sentiment_label'] = df['sentiment_label'].astype(str).str.strip().str.capitalize()
    df = df[df['sentiment_label'].isin(LABEL_MAPPING)].copy()

    df['text_bersih'] = df['comment_asli'].apply(clean_text)
    df = df[df['text_bersih'] != ''].copy()
    df = df.drop_duplicates(subset=['text_bersih']).reset_index(drop=True)

    df['label'] = df['sentiment_label'].map(LABEL_MAPPING).astype(int)
    if 'author' not in df.columns:
        df['author'] = '@anonim'
    else:
        df['author'] = df['author'].fillna('@anonim')
    if 'likes' not in df.columns:
        df['likes'] = 0
    else:
        df['likes'] = df['likes'].fillna(0).astype(int)
    if 'published_at' not in df.columns:
        df['published_at'] = ''
    if 'sumber' not in df.columns:
        df['sumber'] = 'labeled_csv'

    print(f"Total data unik valid siap latih : {len(df)} baris")
    print("\nDistribusi Kelas Sentimen:")
    print(df['sentiment_label'].value_counts())
    return df


# ==============================================================================
# 3. SPLIT DATA, TOKENISASI & PURE FASTTEXT EMBEDDING
# ==============================================================================
def build_fasttext_embedding_matrix(
    X_train_text: np.ndarray,
    tokenizer: Tokenizer,
    vocab_size: int,
    embedding_dim: int,
    seed: int = 42
) -> np.ndarray:
    """
    Membangun matriks bobot FastText Subword (Skip-Gram) murni dari data latih X_train,
    tanpa menyuntikkan nilai polaritas kamus ke dalam dimensi embedding.
    """
    embedding_matrix = np.zeros((vocab_size, embedding_dim), dtype=np.float32)

    if GENSIM_AVAILABLE:
        print("Melatih model Pure FastText Subword (Skip-Gram sg=1) pada X_train...")
        sentences = [str(t).split() for t in X_train_text]
        ft_model = FastText(
            sentences=sentences,
            vector_size=embedding_dim,
            window=5,
            min_count=1,
            sg=1,
            min_n=3,
            max_n=6,
            workers=4,
            epochs=15,
            seed=seed
        )
        for word, idx in tokenizer.word_index.items():
            if idx < vocab_size:
                embedding_matrix[idx] = ft_model.wv[word]
    else:
        print("[INFO] Menginisialisasi bobot Subword Character N-Gram Embedding...")
        rng = np.random.default_rng(seed)
        subword_table = rng.normal(0, 0.1, size=(50000, embedding_dim))
        for word, idx in tokenizer.word_index.items():
            if idx < vocab_size:
                padded_w = f"<{word}>"
                ngrams = [padded_w[i:i + n] for n in (3, 4, 5) for i in range(len(padded_w) - n + 1)] or [word]
                ngram_ids = [hash(ng) % 50000 for ng in ngrams]
                embedding_matrix[idx] = np.mean(subword_table[ngram_ids], axis=0)

    return embedding_matrix


def prepare_datasets_and_embeddings(df: pd.DataFrame, cfg: Config = CFG) -> dict:
    """Membagi data (80:10:10 Stratified), fit Tokenizer hanya pada X_train, dan membangun FastText murni."""
    print("\n" + "=" * 70)
    print("2. SPLIT DATA (80:10:10), TOKENISASI & PURE FASTTEXT EMBEDDING")
    print("=" * 70)

    X_text = df['text_bersih'].to_numpy(dtype=object)
    y = df['label'].to_numpy(dtype=np.int64)

    X_train_text, X_temp_text, y_train, y_temp = train_test_split(
        X_text, y, test_size=0.2, random_state=cfg.random_state, stratify=y
    )
    X_val_text, X_test_text, y_val, y_test = train_test_split(
        X_temp_text, y_temp, test_size=0.5, random_state=cfg.random_state, stratify=y_temp
    )

    print(f"Data Latih (Train)  : {len(X_train_text)} baris")
    print(f"Data Validasi (Val) : {len(X_val_text)} baris")
    print(f"Data Uji (Test)     : {len(X_test_text)} baris")

    weights_arr = compute_class_weight('balanced', classes=np.unique(y_train), y=y_train)
    class_weights = {i: float(w) for i, w in enumerate(weights_arr)}

    # Tokenizer hanya di-fit pada X_train_text (tanpa kamus eksternal & tanpa val/test leakage)
    tokenizer = Tokenizer(
        num_words=cfg.vocab_size,
        oov_token="<OOV>",
        filters='!"#$%&()*+,-./:;<=>?@[\\]^`{|}~\t\n'
    )
    tokenizer.fit_on_texts(list(X_train_text))

    X_train = pad_sequences(tokenizer.texts_to_sequences(X_train_text), maxlen=cfg.max_len, padding='post', truncating='post')
    X_val = pad_sequences(tokenizer.texts_to_sequences(X_val_text), maxlen=cfg.max_len, padding='post', truncating='post')
    X_test = pad_sequences(tokenizer.texts_to_sequences(X_test_text), maxlen=cfg.max_len, padding='post', truncating='post')

    actual_vocab_size = min(cfg.vocab_size, len(tokenizer.word_index) + 1)
    embedding_matrix = build_fasttext_embedding_matrix(
        X_train_text, tokenizer, actual_vocab_size, cfg.embedding_dim, seed=cfg.random_state
    )

    return {
        'X_train': X_train, 'y_train': y_train,
        'X_val': X_val, 'y_val': y_val,
        'X_test': X_test, 'y_test': y_test,
        'X_test_text': X_test_text,
        'tokenizer': tokenizer,
        'vocab_size': actual_vocab_size,
        'embedding_matrix': embedding_matrix,
        'class_weights': class_weights
    }


# ==============================================================================
# 4. PEMBANGUNAN, PELATIHAN & EVALUASI MODEL BiLSTM + DUAL GLOBAL POOLING
# ==============================================================================
def build_bilstm_model(vocab_size: int, embedding_matrix: np.ndarray, cfg: Config = CFG) -> Model:
    """
    Membangun arsitektur model Pure FastText Embedding + Bidirectional LSTM
    dengan Dual Pooling (GlobalAveragePooling1D + GlobalMaxPooling1D).
    """
    inp = Input(shape=(cfg.max_len,), name='input_tokens')
    x = Embedding(
        input_dim=vocab_size,
        output_dim=cfg.embedding_dim,
        weights=[embedding_matrix],
        trainable=True,
        name='fasttext_embedding'
    )(inp)
    x = SpatialDropout1D(cfg.spatial_dropout, name='spatial_dropout')(x)
    x = Bidirectional(LSTM(cfg.bilstm_units, return_sequences=True), name='bilstm_layer')(x)

    avg_pool = GlobalAveragePooling1D(name='global_avg_pool')(x)
    max_pool = GlobalMaxPooling1D(name='global_max_pool')(x)
    x = Concatenate(name='dual_pool_concat')([avg_pool, max_pool])

    x = Dense(64, activation='relu', name='dense_hidden')(x)
    x = Dropout(cfg.dropout_rate, name='dropout_hidden')(x)
    out = Dense(cfg.num_classes, activation='softmax', name='output_softmax')(x)

    model = Model(inputs=inp, outputs=out, name='PureFastText_BiLSTM_DualPool')
    model.compile(
        loss='sparse_categorical_crossentropy',
        optimizer=tf.keras.optimizers.Adam(learning_rate=cfg.learning_rate),
        metrics=['accuracy']
    )
    return model


def save_evaluation_plots_and_metrics(history, y_test: np.ndarray, y_pred: np.ndarray, cfg: Config = CFG) -> None:
    """Menyimpan grafik kurva training, confusion matrix, dan file JSON metrik untuk halaman Performa Model di Dashboard."""
    import matplotlib.pyplot as plt
    import seaborn as sns

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    axes[0].plot(history.history['accuracy'], label='Train Accuracy', marker='o')
    axes[0].plot(history.history['val_accuracy'], label='Val Accuracy', marker='o')
    axes[0].set_title('Kurva Akurasi Training vs Validation (Pure FastText + BiLSTM)')
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Accuracy')
    axes[0].legend()
    axes[0].grid(True, linestyle='--', alpha=0.5)

    axes[1].plot(history.history['loss'], label='Train Loss', marker='o')
    axes[1].plot(history.history['val_loss'], label='Val Loss', marker='o')
    axes[1].set_title('Kurva Loss Training vs Validation (Pure FastText + BiLSTM)')
    axes[1].set_xlabel('Epoch')
    axes[1].set_ylabel('Loss')
    axes[1].legend()
    axes[1].grid(True, linestyle='--', alpha=0.5)

    plt.tight_layout()
    plt.savefig(cfg.history_plot_path, dpi=150)
    plt.close()

    conf_matrix = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        conf_matrix, annot=True, fmt='d', cmap='Blues',
        xticklabels=['Negatif', 'Netral', 'Positif'],
        yticklabels=['Negatif', 'Netral', 'Positif']
    )
    plt.title('Confusion Matrix - Pure FastText + BiLSTM')
    plt.xlabel('Prediksi Model')
    plt.ylabel('Label Aktual (True Label)')
    plt.tight_layout()
    plt.savefig(cfg.cm_plot_path, dpi=150)
    plt.close()

    target_names = ['Negatif', 'Netral', 'Positif']
    report_dict = classification_report(y_test, y_pred, target_names=target_names, output_dict=True)
    metrics_payload = {
        'model_name': 'Pure FastText Subword Embedding + BiLSTM (Dual Global Pooling)',
        'test_accuracy': round(float(accuracy_score(y_test, y_pred)), 4),
        'classification_report': report_dict,
        'confusion_matrix': conf_matrix.tolist(),
        'training_history': {
            'accuracy': [round(float(x), 4) for x in history.history.get('accuracy', [])],
            'val_accuracy': [round(float(x), 4) for x in history.history.get('val_accuracy', [])],
            'loss': [round(float(x), 4) for x in history.history.get('loss', [])],
            'val_loss': [round(float(x), 4) for x in history.history.get('val_loss', [])],
        },
        'hyperparameters': {
            'vocab_size': cfg.vocab_size,
            'embedding_dim': cfg.embedding_dim,
            'max_len': cfg.max_len,
            'bilstm_units': cfg.bilstm_units,
            'pooling': 'GlobalAveragePooling1D + GlobalMaxPooling1D',
            'spatial_dropout': cfg.spatial_dropout,
            'dropout_rate': cfg.dropout_rate,
            'batch_size': cfg.batch_size,
            'learning_rate': cfg.learning_rate,
        }
    }
    with open(cfg.metrics_json_path, 'w', encoding='utf-8') as f:
        json.dump(metrics_payload, f, indent=2, ensure_ascii=False)
    print(f"Metrik JSON disimpan di : {cfg.metrics_json_path}")


def train_and_evaluate(data_bundle: dict, cfg: Config = CFG) -> Model:
    """Melatih model BiLSTM murni, mengevaluasi performa pada Test Set, dan menyimpan artefak model."""
    print("\n" + "=" * 70)
    print("3. TRAINING & EVALUASI MODEL PURE FASTTEXT + BiLSTM")
    print("=" * 70)

    tf.keras.utils.set_random_seed(cfg.random_state)
    model = build_bilstm_model(data_bundle['vocab_size'], data_bundle['embedding_matrix'], cfg)
    model.summary()

    early_stopping = EarlyStopping(monitor='val_accuracy', mode='max', patience=4, restore_best_weights=True)
    lr_scheduler = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-4, verbose=1)

    history = model.fit(
        data_bundle['X_train'], data_bundle['y_train'],
        epochs=cfg.epochs,
        batch_size=cfg.batch_size,
        validation_data=(data_bundle['X_val'], data_bundle['y_val']),
        class_weight=data_bundle['class_weights'],
        callbacks=[early_stopping, lr_scheduler],
        verbose=1
    )

    y_pred_probs = model.predict(data_bundle['X_test'])
    y_pred = np.argmax(y_pred_probs, axis=1)

    target_names = ['Negatif (0)', 'Netral (1)', 'Positif (2)']
    print("\n--- CLASSIFICATION REPORT (TEST SET) ---")
    print(classification_report(data_bundle['y_test'], y_pred, target_names=target_names, digits=4))

    save_evaluation_plots_and_metrics(history, data_bundle['y_test'], y_pred, cfg)

    model.save(cfg.model_path)
    with open(cfg.tokenizer_path, 'wb') as f:
        pickle.dump(data_bundle['tokenizer'], f)
    print(f"Model disimpan di       : {cfg.model_path}")
    print(f"Tokenizer disimpan di   : {cfg.tokenizer_path}")

    return model


# ==============================================================================
# 5. EKSPOR DATA HASIL PREDIKSI KE DATABASE SQLITE & CSV UNTUK DASHBOARD WEB
# ==============================================================================
def export_dashboard_database(
    df_labeled: pd.DataFrame,
    model: Model,
    tokenizer: Tokenizer,
    cfg: Config = CFG
) -> pd.DataFrame:
    """Menjalankan prediksi pada seluruh dataset unik dan menyimpannya ke CSV serta SQLite (`comments`)."""
    print("\n" + "=" * 70)
    print("4. EKSPOR DATA KE DATABASE SQLITE & CSV UNTUK DASHBOARD WEB")
    print("=" * 70)

    sequences = tokenizer.texts_to_sequences(df_labeled['text_bersih'].astype(str).tolist())
    padded = pad_sequences(sequences, maxlen=cfg.max_len, padding='post', truncating='post')

    probs = model.predict(padded, batch_size=256, verbose=0)
    pred_ids = np.argmax(probs, axis=1)
    confidences = np.max(probs, axis=1)

    df_export = pd.DataFrame({
        'id': np.arange(1, len(df_labeled) + 1),
        'author': df_labeled['author'],
        'comment_asli': df_labeled['comment_asli'],
        'text_bersih': df_labeled['text_bersih'],
        'published_at': df_labeled['published_at'],
        'likes': df_labeled['likes'],
        'label_dataset': df_labeled['sentiment_label'],
        'sentimen_prediksi': [ID_TO_LABEL[i] for i in pred_ids],
        'confidence_pct': np.round(confidences * 100, 2),
        'prob_negatif': np.round(probs[:, 0], 4),
        'prob_netral': np.round(probs[:, 1], 4),
        'prob_positif': np.round(probs[:, 2], 4),
        'sumber': df_labeled['sumber'],
    })

    df_export.to_csv(cfg.dashboard_csv_path, index=False, encoding='utf-8')
    print(f"Data CSV Dashboard disimpan di    : {cfg.dashboard_csv_path}")

    with sqlite3.connect(cfg.dashboard_db_path) as conn:
        df_export.to_sql('comments', conn, if_exists='replace', index=False)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_sentimen ON comments(sentimen_prediksi);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_published_at ON comments(published_at);")
    print(f"Database SQLite disimpan di       : {cfg.dashboard_db_path} (tabel: 'comments')")

    return df_export


# ==============================================================================
# 6. FUNGSI INFERENCE (SIAP DI-IMPORT OLEH FASTAPI)
# ==============================================================================
def predict_sentiment(
    texts: list[str],
    model=None,
    tokenizer=None,
    cfg: Config = CFG
) -> pd.DataFrame:
    """Memprediksi sentimen daftar komentar baru beserta tingkat keyakinannya (confidence)."""
    if model is None:
        model = load_model(cfg.model_path)
    if tokenizer is None:
        with open(cfg.tokenizer_path, 'rb') as f:
            tokenizer = pickle.load(f)

    cleaned_texts = [clean_text(t) for t in texts]
    sequences = tokenizer.texts_to_sequences(cleaned_texts)
    padded = pad_sequences(sequences, maxlen=cfg.max_len, padding='post', truncating='post')

    probs = model.predict(padded, verbose=0)
    pred_ids = np.argmax(probs, axis=1)
    confidences = np.max(probs, axis=1)

    results = []
    for raw_t, clean_t, idx, conf, prob_vec in zip(texts, cleaned_texts, pred_ids, confidences, probs):
        results.append({
            'teks_asli': raw_t,
            'teks_bersih': clean_t,
            'sentimen': ID_TO_LABEL[idx],
            'confidence_pct': round(float(conf) * 100, 2),
            'prob_negatif': round(float(prob_vec[0]), 4),
            'prob_netral': round(float(prob_vec[1]), 4),
            'prob_positif': round(float(prob_vec[2]), 4),
        })
    return pd.DataFrame(results)


# ==============================================================================
# 7. MAIN PIPELINE EXECUTION (PURE LEARNING)
# ==============================================================================
def main(dataset_path: str = CFG.labeled_dataset_path):
    df_labeled = load_labeled_dataset(dataset_path)
    data_bundle = prepare_datasets_and_embeddings(df_labeled, CFG)
    model = train_and_evaluate(data_bundle, CFG)
    export_dashboard_database(df_labeled, model, data_bundle['tokenizer'], CFG)

    print("\n" + "=" * 70)
    print("5. DEMO PREDIKSI SENTIMEN KALIMAT BARU (OUTPUT API DASHBOARD)")
    print("=" * 70)
    kalimat_uji = [
        "hapuskan mbg",
        "hbg lwak g guna",
        "wah hebat banget programnya sampai banyak anak keracunan",
        "Parah sih mbg di sekolah adikku hari ini ayamnya bau bgt gak layak makan 😭 @prabowo",
        "aku suka mbg tapi ga suka prabowo",
        "program makan bergizi gratis sangat bagus dan membantu anak sekolah",
        "jangan takut dukung program yang baik untuk rakyat"
    ]
    df_hasil_uji = predict_sentiment(kalimat_uji, model=model, tokenizer=data_bundle['tokenizer'], cfg=CFG)
    print(df_hasil_uji[['teks_asli', 'teks_bersih', 'sentimen', 'confidence_pct']].to_string(index=False))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Tahap 2: Training Model Sentimen MBG (Tanpa Kamus/Leksikon)")
    parser.add_argument(
        '--dataset',
        default=CFG.labeled_dataset_path,
        help=f"Path CSV dataset berlabel (default: {CFG.labeled_dataset_path})"
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    main(dataset_path=args.dataset)
