# CONTEXT.md — Konteks Lengkap Project Machine Learning

Dokumen ini merangkum seluruh konteks proyek, judul resmi, arsitektur sistem, *pipeline* Machine Learning, struktur folder, metrik evaluasi, serta rencana pengembangan lanjutan untuk referensi tim maupun sesi pengembangan berikutnya.

---

## 1. Judul Project & Identitas Tim

- **Judul Project (Lengkap dengan Metode & Model):**  
  **Dashboard Analisis Sentimen Opini Publik Terhadap Program Makan Bergizi Gratis (MBG) Menggunakan FastText Subword Embedding dan Bidirectional LSTM (BiLSTM)**
- **Judul Ringkas:**  
  Dashboard Analisis Sentimen Program Makan Bergizi Gratis (MBG) Berbasis FastText dan BiLSTM
- **Riwayat Penyesuaian Ruang Lingkup:**  
  Pada Progress Report 1 (PR1), judul awal adalah *Sistem Pengambilan Keputusan Hasil Analisis Sentimen Terhadap Program Presiden Makan Bergizi Gratis* (SPK/DSS). Mulai Progress Report 2 (PR2), ruang lingkup difokuskan menjadi **Dashboard Analisis Sentimen Web**.
- **Mata Kuliah / Kelas:** Machine Learning / B (Semester 5)
- **Kelompok:** 14
  1. **Bayu Mutawakkil (`2411522023`)** — Model Baseline ML Klasik, Inference Pipeline, Backend FastAPI, Dokumentasi
  2. **Muhammad Habib (`2411522024`)** — Data Engineering, Pemisahan Pipeline Pelabelan (`ml/label_dataset.py`), Preprocessing Netral (`ml/text_preprocessing.py`), Pure FastText Skip-Gram
  3. **Ghezy Pramudinata Briliantama (`2411522036`)** — Arsitektur BiLSTM (Dual Global Pooling), Hyperparameter Tuning, Evaluasi Model, UI Dashboard

---

## 2. Tujuan & Ruang Lingkup Sistem

Membangun sistem web analisis sentimen opini publik berbahasa Indonesia terhadap Program Makan Bergizi Gratis (MBG) ke dalam **3 kelas sentimen** (`Negatif [0]`, `Netral [1]`, `Positif [2]`) yang mencakup:
1. Ringkasan KPI & proporsi sentimen dengan filter rentang waktu (`7`, `14`, `30` hari, atau seluruh data).
2. Grafik tren perubahan sentimen harian berdasarkan tanggal publikasi komentar.
3. *Word Cloud* dan peringkat 15 kata teratas per kelas sentimen.
4. Uji prediksi *real-time* untuk 1 komentar baru (*Live BiLSTM Inference* + fitur *Load Komentar Acak*) beserta probabilitas per kelas.
5. Prediksi massal via unggahan CSV (*Batch Prediction*, maks. 5.000 baris) + unduh hasil CSV.
6. Visualisasi performa model (*Classification Report*, *Confusion Matrix*, kurva *Training vs Validation Accuracy*).
7. Eksplorasi daftar komentar dari database SQLite (pencarian, filter sentimen, pengurutan, paginasi, ekspor CSV).

---

## 3. Tech Stack & Lingkungan

- **Python Environment:** Python 3.11 di `.venv/`
- **Machine Learning (`ml/`):** TensorFlow CPU `2.21.0`, Keras `3.15.1`, Gensim `4.4.0` (FastText), Scikit-learn `1.9.1`, Pandas `3.1.1`, NumPy `2.4.6`, Matplotlib/Seaborn
- **Backend (`backend/`):** FastAPI `0.163.1`, Uvicorn `0.54.0`, SQLite (`artifacts/dashboard_mbg.db`)
- **Frontend (`frontend/`):** React `19`, Vite `6`, Tailwind CSS `v4` (`@tailwindcss/vite`), Recharts, Lucide React

---

## 4. Struktur Folder Project

```text
TB ML/
├── .venv/                         # Virtual environment Python 3.11 (di-ignore Git)
├── backend/                       # Server Backend REST API (FastAPI)
│   ├── __init__.py
│   └── app.py                     # Server FastAPI (8 endpoint API + penyaji build React)
├── frontend/                      # Antarmuka Web Modern (React + Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── api.js                 # Klien REST API & formatter angka/persen
│   │   ├── App.jsx                # Layout utama, status FastAPI, filter waktu
│   │   └── components/            # KpiSection, TrendChart, TopWordsSection, LivePredictCard, ModelMetricsCard, CommentsTable
│   ├── package.json
│   └── vite.config.js             # Dev proxy /api -> http://127.0.0.1:8000
├── ml/                            # Pipeline Pembuatan Model ML (Terpisah dari Backend)
│   ├── __init__.py
│   ├── text_preprocessing.py      # Pembersihan teks netral & syntactic negation binding
│   ├── label_dataset.py           # Tahap 1: Deduplikasi & pelabelan -> dataset_labeled.csv
│   └── script.py                  # Tahap 2: Training murni Pure FastText + BiLSTM & ekspor DB
├── artifacts/                     # Artefak model terlatih, database aktif, dan evaluasi
│   ├── model_sentimen_mbg.keras   # Model final PureFastText_BiLSTM_DualPool
│   ├── tokenizer.pkl              # Tokenizer Keras (fit hanya pada X_train)
│   ├── model_metrics.json         # Metrik evaluasi lengkap (JSON)
│   ├── dashboard_mbg.db           # Database SQLite aktif (11.202 komentar + prediksi)
│   ├── comments_dashboard.csv     # Ekspor CSV seluruh prediksi dashboard
│   ├── confusion_matrix.png       # Plot Confusion Matrix (Test Set)
│   └── training_history.png       # Plot Akurasi & Loss per epoch
├── kamus/                         # Kamus leksikon Indonesia (khusus Tahap 1 pelabelan)
│   ├── positive.txt               # 1.117 kata positif murni
│   ├── negative.txt               # 2.521 kata negatif murni
│   └── update_kamus.py            # Script pembersihan overlap & pengayaan kamus
├── sentimen mbg dataset/          # Dataset mentah & berlabel
│   ├── MBG_sentiment_analysis.csv # Dataset 1 (11.375 baris)
│   ├── komentar-mbg.csv           # Dataset 2 (15.000 baris; 11.375 unik)
│   └── dataset_labeled.csv        # Dataset unik berlabel (11.202 baris)
├── docs/                          # Laporan & PRD internal (di-ignore Git)
├── Dashboard Sentimen MBG.html    # Fallback HTML statis (opsional)
├── CONTEXT.md                     # Dokumen konteks project ini
├── README.md                      # Panduan penggunaan project
├── requirements.txt               # Dependensi Python
└── .gitignore                     # Aturan pengabaian Git
```

---

## 5. Metode, Arsitektur Model & Pipeline ML

### 5.1 Paradigma & Metode
- **Paradigma:** *Supervised Learning* — Klasifikasi Teks Multikelas (3 kelas: `Negatif`, `Netral`, `Positif`).
- **Word Embedding:** **Pure FastText Subword Embedding (Skip-Gram, `sg=1`)**, `vector_size=128`, `window=5`, `min_n=3`, `max_n=6`, `epochs=15` — dilatih murni pada `X_train` tanpa suntikan *Lexicon Prior*.
- **Model Klasifikasi:** **Bidirectional LSTM (`128` unit)** + **Dual Global Pooling** (`GlobalAveragePooling1D` + `GlobalMaxPooling1D`) + `Dense(64, ReLU)` + `Dropout(0.30)` + `Dense(3, Softmax)`.
- **Total Trainable Parameters:** `2.592.899` (`9,89 MB`); total termasuk *state* optimizer Adam: `7.778.699` (`29,67 MB`).
- **Model Pembanding (*Baseline* di laporan):** `TF-IDF + Multinomial Naive Bayes` (`66,81%`) dan `TF-IDF + Logistic Regression` (`78,21%` pada `11.060` data).

### 5.2 Alur Pipeline (Dipisah agar Bebas *Shortcut Learning*)
1. **Tahap 1 — Pelabelan Terpisah (`ml/label_dataset.py`):**
   - Menggabungkan `MBG_sentiment_analysis.csv` dan `komentar-mbg.csv`, mempertahankan metadata (`author`, `likes`, `published_at`), serta menghapus duplikat hingga diperoleh **`11.202` komentar unik**.
   - Memberikan label awal menggunakan kamus leksikon berbobot (`kamus/positive.txt` & `kamus/negative.txt`) dan menyimpannya ke `sentimen mbg dataset/dataset_labeled.csv`.
   - Distribusi label di `dataset_labeled.csv`: **Negatif `5.100` (45,53%)**, **Positif `3.671` (32,77%)**, **Netral `2.431` (21,70%)**.
2. **Preprocessing Netral (`ml/text_preprocessing.py`):**
   - `clean_text_basic()`: *case folding*, hapus URL/`@mention`/`#hashtag`/angka/simbol, normalisasi huruf berulang ≥ 3 kali (`gobloook` → `goblok`), normalisasi slang (`SLANG_MAP`).
   - `bind_negations_syntactic()`: mengikat negasi secara sintaktis (`tidak suka` → `tidak_suka`, `jangan takut` → `jangan_takut`) **tanpa kamus sentimen**, **tanpa tag `ironi_`**, dan **tanpa duplikasi token kontras**.
3. **Tahap 2 — Pelatihan Murni (`ml/script.py`):**
   - Membaca `dataset_labeled.csv` tanpa menyentuh folder `kamus/`.
   - *Stratified Split* `80:10:10`: **Train `8.961`**, **Validation `1.120`**, **Test `1.121`**.
   - Fit `Tokenizer` (`max_len=80`) dan `FastText` **hanya pada `X_train`**.
   - Training dengan `Adam(lr=1e-3)`, `class_weight='balanced'`, `ReduceLROnPlateau(patience=2)`, dan `EarlyStopping(monitor='val_accuracy', patience=4, restore_best_weights=True)`.
   - Mengekspor artefak ke `artifacts/` (model, tokenizer, metrik, grafik, CSV, dan SQLite).

---

## 6. Performa Model Terkini (Eksperimen 6 — Terpilih)

- **Test Accuracy (`n = 1.121`):** **`81,27%`** (`0.8127`)
- **Macro F1-Score:** **`80,52%`** (`0.8052`)
- **Peak Validation Accuracy:** **`82,05%`** pada Epoch 6 (berhenti di Epoch 10; *train accuracy* naik bertahap `63,02%` → `97,59%`)
- **Per Kelas (`artifacts/model_metrics.json`):**
  - **Negatif (`510`):** Precision `0,8220` | Recall `0,8510` | F1 `0,8362`
  - **Netral (`243`):** Precision `0,7692` | Recall `0,7819` | F1 `0,7755`
  - **Positif (`368`):** Precision `0,8295` | Recall `0,7799` | F1 `0,8039`
- **Confusion Matrix (`Test Set = 1.121`):**
  - Aktual Negatif: `[434, 33, 43]` | Aktual Netral: `[37, 190, 16]` | Aktual Positif: `[57, 24, 287]`
- **Distribusi Prediksi di SQLite (`artifacts/dashboard_mbg.db`, `11.202` baris):**
  - Positif: `3.600` (`32,14%`) | Netral: `2.376` (`21,21%`) | Negatif: `5.226` (`46,65%`)

*(Catatan Audit: Eksperimen 5 sebelumnya mencapai `98,10%` di Epoch 1 karena terjadi shortcut learning dari suntikan Lexicon Prior `vec[0]`/`vec[1]`, `lexicon_corpus`, dan tag `ironi_`. Arsitektur tersebut telah digantikan oleh Eksperimen 6 yang murni belajar dari data.)*

---

## 7. Endpoint REST API (`backend/app.py`)

| Method | Endpoint | Fungsi |
| :--- | :--- | :--- |
| `GET` | `/` | Menyajikan halaman dashboard (`frontend/dist/index.html`, fallback `Dashboard Sentimen MBG.html`) |
| `GET` | `/api/summary?days=0` | Total komentar, jumlah & persentase per sentimen |
| `GET` | `/api/trend?days=30` | Tren jumlah komentar harian per sentimen |
| `GET` | `/api/top-words?limit=15` | 15 kata paling sering muncul per sentimen |
| `GET` | `/api/comments` | Daftar komentar (search `q`, filter `sentiment`, `sort`, `days`, paginasi) |
| `GET` | `/api/random-comments?limit=1` | Mengambil komentar acak dari SQLite |
| `GET` | `/api/model-metrics` | Membaca `artifacts/model_metrics.json` |
| `POST` | `/api/predict` | Prediksi real-time 1 teks komentar (`{"text": "..."}`) |
| `POST` | `/api/predict-batch` | Prediksi massal file `.csv` (maks. 5.000 baris) |

---

## 8. Cara Menjalankan

1. **Jalankan Backend FastAPI + Dashboard (Mode Produksi / 1 Server):**
   ```powershell
   .\.venv\Scripts\python.exe backend\app.py
   ```
   Akses: `http://127.0.0.1:8000` (Dashboard) · `http://127.0.0.1:8000/docs` (Swagger API).

2. **Jalankan Frontend Dev Server (Hot Reload React + Vite):**
   ```powershell
   cd frontend
   npm run dev
   ```
   Akses: `http://localhost:5173` (pastikan backend FastAPI juga menyala di port `8000`).

3. **Build Ulang Frontend ke `frontend/dist/`:**
   ```powershell
   cd frontend
   npm run build
   ```

4. **Jalankan Ulang Pipeline ML (`ml/`):**
   ```powershell
   .\.venv\Scripts\python.exe ml\label_dataset.py
   .\.venv\Scripts\python.exe ml\script.py
   ```

---

## 9. Keterbatasan Saat Ini & Rencana Tindak Lanjut

1. **Kualitas Label Latih (Ide 2 & *Gold Standard*):** Saat ini `sentiment_label` di `dataset_labeled.csv` masih dihasilkan oleh leksikon (`ml/label_dataset.py`), sehingga kalimat sarkasme halus tanpa kata pemicu kamus masih rawan salah prediksi. Rencana lanjut: melabeli ulang komentar menggunakan model AI kontekstual (mis. Claude/LLM) serta melakukan anotasi manual pada `300–500` sampel *Test Set* sebagai *human ground truth*.
2. **Evaluasi Ulang Baseline (*Apple-to-Apple*):** Menjalankan ulang `TF-IDF + MNB` dan `TF-IDF + Logistic Regression` pada split `11.202` data (`dataset_labeled.csv`) yang sama dengan Eksperimen 6.
3. **Deployment & UAT:** Publikasi backend FastAPI + frontend React ke server cloud/container dan pengujian akhir bersama pengguna.
