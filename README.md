# Dashboard Analisis Sentimen Opini Publik Program Makan Bergizi Gratis (MBG)

Proyek Tugas Besar **Machine Learning** (Kelompok 14) untuk menganalisis dan memvisualisasikan sentimen opini publik terhadap **Program Makan Bergizi Gratis (MBG)** menggunakan metode **FastText Subword Embedding + Bidirectional LSTM (BiLSTM)**.

---

## Struktur Folder Project

```text
TB ML/
├── .venv/                         # Virtual environment Python 3.11 (TensorFlow, Gensim, FastAPI)
├── artifacts/                     # Seluruh output model, database, dan visualisasi
│   ├── model_sentimen_mbg.keras   # Model utama FastText + BiLSTM (Test Accuracy: 85.37%)
│   ├── tokenizer.pkl              # Tokenizer Keras
│   ├── model_metrics.json         # Metrik evaluasi (Classification Report, Confusion Matrix, History)
│   ├── dashboard_mbg.db           # Database SQLite berisi 11.061 komentar unik + prediksi
│   ├── comments_dashboard.csv     # Ekspor CSV hasil prediksi seluruh komentar
│   ├── confusion_matrix.png       # Visualisasi Confusion Matrix pada Test Set
│   └── training_history.png       # Grafik kurva Akurasi & Loss (Training vs Validation)
├── docs/                          # Dokumentasi laporan & perancangan sistem
│   ├── Laporan progress ML.pdf    # Dokumen Laporan Progress Machine Learning
│   └── PRD_Dashboard_Sentimen_MBG.md # Product Requirements Document (PRD) Dashboard Web
├── kamus/                         # Kamus Leksikon Bahasa Indonesia (ID-OpinionWords + Domain MBG)
│   ├── positive.txt               # 1.065 kata positif murni
│   ├── negative.txt               # 2.289 kata negatif murni
│   └── update_kamus.py            # Script pembersihan & pengayaan kamus leksikon
├── sentimen mbg dataset/          # Dataset mentah CSV
│   ├── MBG_sentiment_analysis.csv # Dataset 1 (11.375 baris)
│   └── komentar-mbg.csv           # Dataset 2 (15.000 baris)
├── script.py                      # Pipeline utama: Preprocessing, Labeling, Training BiLSTM & Export DB
├── app.py                         # Server Backend FastAPI untuk Dashboard Sentimen
├── Dashboard Sentimen MBG.html    # Antarmuka Web Dashboard Sentimen MBG
├── requirements.txt               # Daftar library Python yang digunakan
└── README.md                      # Dokumentasi penggunaan project
```

---

## Cara Menjalankan Project

### 1. Menjalankan Server Dashboard Web (FastAPI)
Model dan database sudah tersedia di folder `artifacts/`. Untuk langsung membuka dashboard:

```powershell
.\.venv\Scripts\python.exe app.py
```

Lalu buka browser dan akses:
- **Dashboard Sentimen MBG**: http://127.0.0.1:8000
- **Dokumentasi Swagger API**: http://127.0.0.1:8000/docs

### 2. Melatih Ulang Model (`script.py`)
Jika ingin menjalankan ulang proses *preprocessing*, *pelabelan leksikon*, *training FastText + BiLSTM*, hingga ekspor ulang database:

```powershell
.\.venv\Scripts\python.exe script.py
```
