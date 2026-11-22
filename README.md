# Dashboard Analisis Sentimen Opini Publik Program Makan Bergizi Gratis (MBG)

Proyek Tugas Besar **Machine Learning** (Kelompok 14) untuk menganalisis dan memvisualisasikan sentimen opini publik terhadap **Program Makan Bergizi Gratis (MBG)** menggunakan metode **Pure FastText Subword Embedding + Bidirectional LSTM (BiLSTM)**.

---

## Struktur Folder Project

```text
TB ML/
├── .venv/                         # Virtual environment Python 3.11 (TensorFlow, Gensim, FastAPI)
├── backend/                       # Server Backend REST API (FastAPI)
│   ├── __init__.py
│   └── app.py                     # Entry point FastAPI + penyaji frontend React build
├── frontend/                      # Antarmuka Web Modern (React + Vite + Tailwind CSS v4)
│   ├── src/                       # Komponen dashboard & API client
│   ├── package.json
│   └── vite.config.js             # Dev proxy /api -> http://127.0.0.1:8000
├── ml/                            # Pipeline Pembuatan Model Machine Learning (Terpisah)
│   ├── __init__.py
│   ├── text_preprocessing.py      # Utilitas pembersihan teks netral & syntactic negation binding
│   ├── label_dataset.py           # Tahap 1: Deduplikasi & pelabelan dataset -> dataset_labeled.csv
│   └── script.py                  # Tahap 2: Training murni Pure FastText + BiLSTM & ekspor DB
├── artifacts/                     # Output model terlatih, database aktif, dan visualisasi evaluasi
│   ├── model_sentimen_mbg.keras   # Model utama Pure FastText + BiLSTM (Test Accuracy: 81.27%)
│   ├── tokenizer.pkl              # Tokenizer Keras (di-fit hanya pada X_train)
│   ├── model_metrics.json         # Metrik evaluasi (Classification Report, Confusion Matrix, History)
│   ├── dashboard_mbg.db           # Database SQLite aktif berisi 11.202 komentar unik + prediksi
│   ├── comments_dashboard.csv     # Ekspor CSV hasil prediksi seluruh komentar
│   ├── confusion_matrix.png       # Visualisasi Confusion Matrix pada Test Set
│   └── training_history.png       # Grafik kurva Akurasi & Loss (Training vs Validation)
├── kamus/                         # Kamus Leksikon Bahasa Indonesia (khusus tahap pelabelan)
│   ├── positive.txt               # 1.117 kata positif murni
│   ├── negative.txt               # 2.521 kata negatif murni
│   └── update_kamus.py            # Script pembersihan & pengayaan kamus leksikon
├── sentimen mbg dataset/          # Dataset mentah & hasil pelabelan terpisah
│   ├── MBG_sentiment_analysis.csv # Dataset 1 (11.375 baris)
│   ├── komentar-mbg.csv           # Dataset 2 (15.000 baris)
│   └── dataset_labeled.csv        # Dataset unik berlabel (11.202 baris) siap dilatih
├── docs/                          # Dokumentasi internal & laporan (diabaikan di .gitignore)
├── Dashboard Sentimen MBG.html    # Fallback dashboard HTML statis
├── requirements.txt               # Daftar library Python yang digunakan
├── .gitignore                     # Aturan pengabaian file Git
└── README.md                      # Dokumentasi penggunaan project
```

---

## Cara Menjalankan Project

### 1. Menjalankan Server Dashboard Web (FastAPI + React Build)
Model, database aktif, dan hasil build frontend (`frontend/dist/`) sudah siap digunakan:

```powershell
.\.venv\Scripts\python.exe backend\app.py
```

Lalu buka browser dan akses:
- **Dashboard Sentimen MBG**: http://127.0.0.1:8000
- **Dokumentasi Swagger API**: http://127.0.0.1:8000/docs

### 2. Mode Development Frontend (Hot Reload React + Vite)
Jalankan backend FastAPI di terminal 1 (`.\.venv\Scripts\python.exe backend\app.py`), lalu di terminal 2:

```powershell
cd frontend
npm run dev
```
Buka `http://localhost:5173` (request `/api/*` otomatis diteruskan ke FastAPI).

### 3. Menjalankan Ulang Pipeline Pelabelan & Pelatihan Model (`ml/`)
1. **Tahap 1 — Pelabelan Dataset:**
   ```powershell
   .\.venv\Scripts\python.exe ml\label_dataset.py
   ```
2. **Tahap 2 — Pelatihan Model Murni & Ekspor DB:**
   ```powershell
   .\.venv\Scripts\python.exe ml\script.py
   ```
