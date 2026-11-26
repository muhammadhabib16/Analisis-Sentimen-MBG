# ==============================================================================
# TAHAP 1: DATA PREPARATION & PELABELAN DATASET SENTIMEN MBG
# Output: sentimen mbg dataset/dataset_labeled.csv
#
# File hasil pelabelan terpisah dari script training (`script.py`), sehingga:
# 1. Script training tidak menyentuh kamus/leksikon sama sekali (bebas shortcut).
# 2. Kolom `sentiment_label` di `dataset_labeled.csv` dapat diganti/divalidasi
#    menggunakan model AI (mis. Claude/LLM) maupun anotasi manual manusia
#    sebelum menjalankan `python script.py`.
# ==============================================================================

import argparse
import os
import sys
from functools import lru_cache

import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) if '__file__' in globals() else os.getcwd()
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from ml.text_preprocessing import (
    LABEL_MAPPING,
    NEGATION_WORDS,
    clean_text,
    clean_text_basic,
)

DATASET_DIR = os.path.join(BASE_DIR, 'sentimen mbg dataset')
KAMUS_DIR = os.path.join(BASE_DIR, 'kamus')
DEFAULT_OUTPUT_PATH = os.path.join(DATASET_DIR, 'dataset_labeled.csv')

CONTRAST_WORDS = {'tapi', 'namun', 'padahal', 'sayangnya', 'malah', 'tetapi'}
INTENSIFIER_WORDS = {'sangat', 'banget', 'terlalu', 'parah', 'paling', 'beneran', 'sungguh', 'amat'}

STRONG_NEGATIVE_WORDS = {
    'hapus', 'hapuskan', 'bubarkan', 'bubar', 'batalkan', 'batal', 'hentikan', 'stop', 'tolak', 'boikot',
    'keracunan', 'racun', 'beracun', 'basi', 'berulat', 'ulat', 'belatung', 'diare', 'muntah', 'busuk',
    'koruptor', 'korupsi', 'maling', 'rampok', 'garong', 'tilep', 'sunat',
    'anjing', 'asu', 'babi', 'bangsat', 'bajingan', 'brengsek', 'keparat', 'biadab', 'najis',
    'goblok', 'tolol', 'bodoh', 'bego', 'dungu', 'idiot', 'bacot', 'jancok', 'jancuk',
    'kontol', 'memek', 'pepek', 'jembut', 'peler', 'ngentot', 'perek', 'lonte', 'pelacur',
    'fuck', 'fucking', 'shit', 'bullshit', 'asshole', 'bitch', 'bastard', 'cunt', 'motherfucker',
    'sampah', 'ampas', 'hancur', 'bobrok', 'gagal', 'lawak', 'badut', 'omdo', 'omon', 'pencitraan'
}

SARCASM_PRAISE_WORDS = {
    'bagus', 'hebat', 'mantap', 'keren', 'jenius', 'sukses', 'brilian', 'luar', 'terbaik', 'pintar', 'cerdas'
}

IRONY_TRIGGERS = STRONG_NEGATIVE_WORDS | {
    'bocor', 'utang', 'hutang', 'sengsara', 'menderita', 'puskesmas', 'gimik'
}


def load_lexicon_dictionaries(kamus_dir: str = KAMUS_DIR) -> tuple[set[str], set[str]]:
    """Memuat kamus kata positif dan negatif serta membersihkan overlap & kata negasi."""
    pos_path = os.path.join(kamus_dir, 'positive.txt')
    neg_path = os.path.join(kamus_dir, 'negative.txt')

    if os.path.exists(pos_path) and os.path.exists(neg_path):
        with open(pos_path, 'r', encoding='utf-8') as f:
            pos_words = set(line.strip().lower() for line in f if line.strip())
        with open(neg_path, 'r', encoding='utf-8') as f:
            neg_words = set(line.strip().lower() for line in f if line.strip())
    else:
        import requests
        url_pos = "https://raw.githubusercontent.com/masdevid/ID-OpinionWords/master/positive.txt"
        url_neg = "https://raw.githubusercontent.com/masdevid/ID-OpinionWords/master/negative.txt"
        pos_words = set(line.strip().lower() for line in requests.get(url_pos, timeout=15).text.splitlines() if line.strip())
        neg_words = set(line.strip().lower() for line in requests.get(url_neg, timeout=15).text.splitlines() if line.strip())

    overlap = pos_words.intersection(neg_words)
    pos_clean = (pos_words - overlap) - NEGATION_WORDS
    neg_clean = (neg_words - overlap) - NEGATION_WORDS
    return pos_clean, neg_clean


POSITIVE_WORDS, NEGATIVE_WORDS = load_lexicon_dictionaries(KAMUS_DIR)


@lru_cache(maxsize=30000)
def get_word_polarity(word: str) -> int:
    """Mengembalikan polaritas kata (+1 Positif, -1 Negatif, 0 Netral) dengan fallback pemotongan imbuhan."""
    if word in POSITIVE_WORDS:
        return 1
    if word in NEGATIVE_WORDS:
        return -1

    stems = [word]
    for suf in ('nya', 'kan', 'an', 'i'):
        if word.endswith(suf) and len(word) - len(suf) >= 4:
            stems.append(word[:-len(suf)])
    for s in list(stems):
        for pref in ('meng', 'meny', 'mem', 'men', 'me', 'peng', 'pen', 'pem', 'pe', 'di', 'ter', 'ber'):
            if s.startswith(pref) and len(s) - len(pref) >= 4:
                stems.append(s[len(pref):])

    for cand in stems[1:]:
        if cand in POSITIVE_WORDS:
            return 1
        if cand in NEGATIVE_WORDS:
            return -1
    return 0


def bind_negations_for_labeling(text: str) -> str:
    """Mengikat negasi terhadap kata opini (khusus untuk skoring leksikon di tahap pelabelan)."""
    words = str(text).split()
    out = []
    i = 0
    while i < len(words):
        w = words[i]
        if w in NEGATION_WORDS and i + 1 < len(words) and get_word_polarity(words[i + 1]) != 0:
            out.append(f"{w}_{words[i + 1]}")
            i += 2
        elif w in NEGATION_WORDS and i + 2 < len(words) and get_word_polarity(words[i + 2]) != 0:
            out.append(words[i + 1])
            out.append(f"{w}_{words[i + 2]}")
            i += 3
        else:
            out.append(w)
            i += 1
    return " ".join(out).strip()


def reconstruct_text_for_labeling(row: pd.Series) -> str:
    """Merekonstruksi teks bersih Dataset 1 dengan tetap mempertahankan kata negasi & kontras."""
    norm_text = clean_text_basic(row.get('normalisasi', ''))
    sw_text = clean_text_basic(row.get('stopword removal', ''))
    if not norm_text:
        return bind_negations_for_labeling(sw_text)
    if not sw_text:
        return bind_negations_for_labeling(norm_text)

    sw_vocab = set(sw_text.split())
    kept_words = [
        w for w in norm_text.split()
        if (w in sw_vocab or w in NEGATION_WORDS or w in CONTRAST_WORDS)
    ]
    return bind_negations_for_labeling(" ".join(kept_words))


def score_sentiment_lexicon(text: str) -> str:
    """Memberikan label sentimen ('Negatif', 'Netral', 'Positif') berbasis leksikon berbobot."""
    if not isinstance(text, str):
        return 'Netral'
    tokens = text.split()
    has_irony_marker = any(t in IRONY_TRIGGERS for t in tokens)
    has_sarcastic_praise = has_irony_marker and any(t in SARCASM_PRAISE_WORDS for t in tokens)

    pos_score, neg_score = 0.0, 0.0
    clause_weight = 1.0
    boost_next = 1.0

    for token in tokens:
        if token in CONTRAST_WORDS:
            clause_weight = 2.0
            boost_next = 1.0
            continue
        if token in INTENSIFIER_WORDS:
            boost_next = 1.5
            continue

        cur_w = clause_weight * boost_next
        boost_next = 1.0

        if "_" in token:
            parts = token.split("_", 1)
            if parts[0] in NEGATION_WORDS:
                pol = get_word_polarity(parts[1])
                if pol == 1:
                    neg_score += cur_w * 1.5
                elif pol == -1:
                    pos_score += cur_w
                continue

        if token in STRONG_NEGATIVE_WORDS:
            neg_score += cur_w * 3.0
            continue

        pol = get_word_polarity(token)
        if pol == 1:
            if has_sarcastic_praise and token in SARCASM_PRAISE_WORDS:
                neg_score += cur_w * 2.0
            else:
                pos_score += cur_w
        elif pol == -1:
            neg_score += cur_w * 1.2

    if pos_score > neg_score:
        return 'Positif'
    if neg_score > pos_score:
        return 'Negatif'
    return 'Netral'


MBG_TOPIC_REGEX = r'\b(?:mbg|makan|bergizi|gizi|gratis|katering|dapur|porsi|menu|keracunan|basi|siswa|sekolah|susu|anggaran|program)\b'
OFFTOPIC_TIO_REGEX = r'\b(?:tio|tyo|bem|ugm|mahasiswa|ketua)\b'


def parse_twitter_date(val) -> str:
    """Mengonversi format tanggal X/Twitter ('Mon Feb 10 15:00:22 +0000 2025') ke ISO-8601."""
    if pd.isna(val) or not str(val).strip():
        return ''
    dt = pd.to_datetime(val, format='%a %b %d %H:%M:%S %z %Y', errors='coerce')
    if pd.isna(dt):
        dt = pd.to_datetime(val, errors='coerce')
    return dt.strftime('%Y-%m-%dT%H:%M:%SZ') if not pd.isna(dt) else str(val)


def load_and_merge_raw_datasets(
    dataset_dir: str = DATASET_DIR,
    drop_offtopic_tio: bool = True,
    strict_mbg: bool = False,
) -> pd.DataFrame:
    """Memuat seluruh dataset CSV mentah (YouTube + X/Twitter), menggabungkan metadata, menyaring noise, dan menghapus duplikat."""
    file_df1 = os.path.join(dataset_dir, 'MBG_sentiment_analysis.csv')
    file_df2 = os.path.join(dataset_dir, 'komentar-mbg.csv')
    file_df3 = os.path.join(dataset_dir, 'DatasetMBG.csv')

    df1 = pd.read_csv(file_df1)
    df2 = pd.read_csv(file_df2)

    print("=" * 70)
    print("1. LOAD, FILTER NOISE, & DEDUPLIKASI DATASET MENTAH")
    print("=" * 70)
    print(f"Dataset 1 (MBG_sentiment_analysis.csv) : {df1.shape[0]} baris")
    print(f"Dataset 2 (komentar-mbg.csv)           : {df2.shape[0]} baris")

    df2_valid = df2.dropna(subset=['comment']).copy()
    df2_valid['comment_key'] = df2_valid['comment'].astype(str).str.strip()
    df2_unique = df2_valid.drop_duplicates(subset=['comment_key']).copy()

    df1_valid = df1.dropna(subset=['comment']).copy()
    df1_valid['comment_key'] = df1_valid['comment'].astype(str).str.strip()
    df1_valid['text_for_labeling'] = df1_valid.apply(reconstruct_text_for_labeling, axis=1)
    df1_valid['text_bersih'] = df1_valid['comment'].apply(clean_text)
    df1_valid = df1_valid[(df1_valid['text_for_labeling'] != '') & (df1_valid['text_bersih'] != '')]

    df1_merged = df1_valid.merge(
        df2_unique[['comment_key', 'author', 'likes', 'published_at']],
        on='comment_key',
        how='left'
    )

    df2_only = df2_unique[~df2_unique['comment_key'].isin(set(df1_valid['comment_key']))].copy()
    df2_only['text_for_labeling'] = df2_only['comment'].apply(lambda t: bind_negations_for_labeling(clean_text_basic(t)))
    df2_only['text_bersih'] = df2_only['comment'].apply(clean_text)
    df2_only = df2_only[(df2_only['text_for_labeling'] != '') & (df2_only['text_bersih'] != '')]

    frames = [
        pd.DataFrame({
            'author': df1_merged['author'].fillna('@anonim'),
            'comment_asli': df1_merged['comment'],
            'text_bersih': df1_merged['text_bersih'],
            'text_for_labeling': df1_merged['text_for_labeling'],
            'published_at': df1_merged['published_at'],
            'likes': df1_merged['likes'].fillna(0).astype(int),
            'sumber': 'youtube_1',
        }),
        pd.DataFrame({
            'author': df2_only['author'].fillna('@anonim'),
            'comment_asli': df2_only['comment'],
            'text_bersih': df2_only['text_bersih'],
            'text_for_labeling': df2_only['text_for_labeling'],
            'published_at': df2_only['published_at'],
            'likes': df2_only['likes'].fillna(0).astype(int),
            'sumber': 'youtube_2',
        }),
    ]

    if os.path.exists(file_df3):
        df3 = pd.read_csv(file_df3)
        print(f"Dataset 3 (DatasetMBG.csv / X-Twitter) : {df3.shape[0]} baris")
        df3_valid = df3.dropna(subset=['full_text']).copy()
        df3_valid['text_for_labeling'] = df3_valid['full_text'].apply(lambda t: bind_negations_for_labeling(clean_text_basic(t)))
        df3_valid['text_bersih'] = df3_valid['full_text'].apply(clean_text)
        df3_valid = df3_valid[(df3_valid['text_for_labeling'] != '') & (df3_valid['text_bersih'] != '')]
        authors_tw = df3_valid['username'].fillna('anonim').astype(str).apply(lambda u: u if u.startswith('@') else f'@{u}')
        frames.append(pd.DataFrame({
            'author': authors_tw,
            'comment_asli': df3_valid['full_text'],
            'text_bersih': df3_valid['text_bersih'],
            'text_for_labeling': df3_valid['text_for_labeling'],
            'published_at': df3_valid['created_at'].apply(parse_twitter_date),
            'likes': df3_valid['favorite_count'].fillna(0).astype(int),
            'sumber': 'twitter_mbg',
        }))

    df_gabung = pd.concat(frames, ignore_index=True)
    df_gabung = df_gabung.drop_duplicates(subset=['text_bersih']).reset_index(drop=True)

    txt_lower = df_gabung['comment_asli'].astype(str).str.lower()
    has_mbg = txt_lower.str.contains(MBG_TOPIC_REGEX, regex=True)
    has_tio = txt_lower.str.contains(OFFTOPIC_TIO_REGEX, regex=True)

    if strict_mbg:
        before = len(df_gabung)
        df_gabung = df_gabung[has_mbg].reset_index(drop=True)
        print(f"Filter --strict-mbg                    : {before} -> {len(df_gabung)} baris (100% eksplisit MBG)")
    elif drop_offtopic_tio:
        before = len(df_gabung)
        df_gabung = df_gabung[~(has_tio & ~has_mbg)].reset_index(drop=True)
        print(f"Filter noise Tio/BEM (tanpa MBG)       : dibuang {before - len(df_gabung)} baris -> {len(df_gabung)} baris")

    df_gabung.insert(0, 'id', range(1, len(df_gabung) + 1))
    print(f"Total data unik siap dilabeli          : {len(df_gabung)} baris")
    return df_gabung


def run_labeling(
    output_path: str = DEFAULT_OUTPUT_PATH,
    drop_offtopic_tio: bool = True,
    strict_mbg: bool = False,
) -> pd.DataFrame:
    """Menjalankan pelabelan dataset dan menyimpannya ke CSV agar siap dilatih oleh `ml/script.py`."""
    df = load_and_merge_raw_datasets(
        DATASET_DIR,
        drop_offtopic_tio=drop_offtopic_tio,
        strict_mbg=strict_mbg,
    )

    print("\n" + "=" * 70)
    print("2. PELABELAN OTOMATIS (LEKSIKON + NEGASI)")
    print("=" * 70)
    print(f"Kamus Positif Murni : {len(POSITIVE_WORDS)} kata")
    print(f"Kamus Negatif Murni : {len(NEGATIVE_WORDS)} kata")

    df['sentiment_label'] = df['text_for_labeling'].apply(score_sentiment_lexicon)
    df['label'] = df['sentiment_label'].map(LABEL_MAPPING)
    df['label_source'] = 'lexicon'

    # Simpan kolom standar tanpa membawa token rekayasa kamus ke tahap training
    cols_export = [
        'id', 'author', 'comment_asli', 'published_at', 'likes',
        'sumber', 'sentiment_label', 'label', 'label_source'
    ]
    df_out = df[cols_export].copy()

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df_out.to_csv(output_path, index=False, encoding='utf-8')

    print("\nDistribusi Kelas Sentimen:")
    print(df_out['sentiment_label'].value_counts())
    print(f"\nDataset berlabel disimpan di: {output_path}")
    print("Langkah berikutnya: jalankan `python ml/script.py` untuk melatih model murni dari dataset ini.")
    return df_out


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Tahap 1: Pelabelan Dataset Sentimen MBG")
    parser.add_argument(
        '--output',
        default=DEFAULT_OUTPUT_PATH,
        help=f"Path output CSV berlabel (default: {DEFAULT_OUTPUT_PATH})"
    )
    parser.add_argument(
        '--strict-mbg',
        action='store_true',
        help="Hanya simpan komentar yang secara eksplisit menyebut kata kunci topik MBG."
    )
    parser.add_argument(
        '--keep-offtopic-tio',
        action='store_true',
        help="Pertahankan komentar Tio/BEM yang tidak menyebut MBG."
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run_labeling(
        output_path=args.output,
        drop_offtopic_tio=not args.keep_offtopic_tio,
        strict_mbg=args.strict_mbg,
    )
