# ==============================================================================
# FASTAPI BACKEND SERVER — DASHBOARD ANALISIS SENTIMEN MBG
# Integrasi Model FastText + BiLSTM (model_sentimen_mbg.keras) & SQLite Database
# ==============================================================================

import io
import json
import os
import pickle
import re
import sqlite3
import sys
from collections import Counter
from contextlib import asynccontextmanager
from typing import Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from keras.models import load_model

from ml.script import CFG, ID_TO_LABEL, clean_text, predict_sentiment

HTML_PATH = os.path.join(BASE_DIR, "Dashboard Sentimen MBG.html")
FRONTEND_DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")
FRONTEND_ASSETS_DIR = os.path.join(FRONTEND_DIST_DIR, "assets")
FRONTEND_INDEX_PATH = os.path.join(FRONTEND_DIST_DIR, "index.html")

# State global untuk menyimpan model & tokenizer di memori selama server berjalan
ml_state = {
    "model": None,
    "tokenizer": None,
}

# Daftar kata umum (stopwords tambahan) yang diabaikan pada perhitungan Top Words / Word Cloud
STOPWORDS_ID = {
    "yang", "dan", "di", "ke", "dari", "ini", "itu", "untuk", "dengan", "pada",
    "adalah", "tidak", "bukan", "jangan", "kurang", "belum", "juga", "sudah",
    "saja", "lagi", "akan", "bisa", "ada", "kalau", "karena", "sama", "atau",
    "tapi", "namun", "oleh", "dalam", "seperti", "para", "kita", "kami", "saya",
    "aku", "kamu", "anda", "dia", "mereka", "nya", "ya", "kok", "sih", "deh",
    "동", "kan", "lah", "pun", "jadi", "mau", "buat", "pak", "bu", "mas", "bang"
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Memuat model BiLSTM (.keras) dan Tokenizer (.pkl) satu kali saat server dinyalakan."""
    print("=" * 70)
    print("Memuat model FastText + BiLSTM & Tokenizer ke dalam memori...")
    if os.path.exists(CFG.model_path) and os.path.exists(CFG.tokenizer_path):
        ml_state["model"] = load_model(CFG.model_path)
        with open(CFG.tokenizer_path, "rb") as f:
            ml_state["tokenizer"] = pickle.load(f)
        print("Model dan Tokenizer berhasil dimuat! Server siap menerima request.")
    else:
        print("[PERINGATAN] File model/tokenizer belum ditemukan. Jalankan `python ml/script.py` terlebih dahulu.")
    print("=" * 70)
    yield
    ml_state.clear()


app = FastAPI(
    title="API Dashboard Analisis Sentimen MBG",
    description="Backend API untuk Dashboard Analisis Sentimen Program Makan Bergizi Gratis (FastText + BiLSTM)",
    version="1.0.0",
    lifespan=lifespan,
)

# Izinkan akses CORS agar file HTML bisa memanggil API baik dari localhost maupun file://
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if os.path.isdir(FRONTEND_ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS_DIR), name="frontend-assets")


def get_db_connection() -> sqlite3.Connection:
    if not os.path.exists(CFG.dashboard_db_path):
        raise HTTPException(
            status_code=500,
            detail="Database belum tersedia. Jalankan `python ml/script.py` terlebih dahulu."
        )
    conn = sqlite3.connect(CFG.dashboard_db_path)
    conn.row_factory = sqlite3.Row
    return conn


def build_date_filter_clause(conn: sqlite3.Connection, days: int) -> tuple[str, list]:
    """Membuat klausa filter rentang hari relatif terhadap tanggal terbaru di database."""
    if not days or days <= 0:
        return "", []
    row = conn.execute(
        "SELECT MAX(SUBSTR(published_at, 1, 10)) AS max_date FROM comments WHERE published_at IS NOT NULL"
    ).fetchone()
    if not row or not row["max_date"]:
        return "", []
    return (
        " AND SUBSTR(published_at, 1, 10) >= date(?, ?)",
        [row["max_date"], f"-{days - 1} days"]
    )


# ==============================================================================
# SKEMA REQUEST / RESPONSE PYDANTIC
# ==============================================================================
class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="Teks komentar yang akan diuji")


# ==============================================================================
# ENDPOINT HALAMAN UTAMA DASHBOARD
# ==============================================================================
@app.get("/", response_class=HTMLResponse)
def serve_dashboard():
    """Menampilkan halaman web Dashboard Sentimen MBG (prioritas build React Vite, fallback HTML statis)."""
    if os.path.exists(FRONTEND_INDEX_PATH):
        return FileResponse(FRONTEND_INDEX_PATH)
    if os.path.exists(HTML_PATH):
        return FileResponse(HTML_PATH)
    return HTMLResponse("<h1>Frontend Dashboard tidak ditemukan.</h1>", status_code=404)


# ==============================================================================
# ENDPOINT REST API DASHBOARD
# ==============================================================================
@app.get("/api/summary")
def get_summary(days: int = Query(0, description="Filter N hari terakhir (0 = Semua data)")):
    """Mengambil total komentar dan distribusi sentimen (Positif, Netral, Negatif)."""
    with get_db_connection() as conn:
        date_sql, params = build_date_filter_clause(conn, days)
        rows = conn.execute(
            f"""
            SELECT sentimen_prediksi AS sentimen, COUNT(*) AS jumlah
            FROM comments
            WHERE 1=1 {date_sql}
            GROUP BY sentimen_prediksi
            """,
            params,
        ).fetchall()

    counts = {"Positif": 0, "Netral": 0, "Negatif": 0}
    for r in rows:
        if r["sentimen"] in counts:
            counts[r["sentimen"]] = int(r["jumlah"])

    total = sum(counts.values())
    return {
        "total": total,
        "days": days,
        "counts": counts,
        "percentages": {
            k: round((v / total * 100), 2) if total > 0 else 0.0
            for k, v in counts.items()
        },
    }


@app.get("/api/trend")
def get_trend(days: int = Query(30, description="Rentang hari tren (7, 14, 30, atau 0 untuk semua)")):
    """Mengambil tren jumlah komentar harian per kelas sentimen."""
    with get_db_connection() as conn:
        date_sql, params = build_date_filter_clause(conn, days)
        rows = conn.execute(
            f"""
            SELECT SUBSTR(published_at, 1, 10) AS tanggal,
                   sentimen_prediksi AS sentimen,
                   COUNT(*) AS jumlah
            FROM comments
            WHERE published_at IS NOT NULL AND published_at != '' {date_sql}
            GROUP BY tanggal, sentimen_prediksi
            ORDER BY tanggal ASC
            """,
            params,
        ).fetchall()

    by_date: dict[str, dict[str, int]] = {}
    for r in rows:
        tgl = r["tanggal"]
        if not tgl:
            continue
        if tgl not in by_date:
            by_date[tgl] = {"Positif": 0, "Netral": 0, "Negatif": 0}
        if r["sentimen"] in by_date[tgl]:
            by_date[tgl][r["sentimen"]] = int(r["jumlah"])

    # Jika filter hari menghasilkan terlalu sedikit titik tanggal karena distribusi tanggal di dataset,
    # ambil N tanggal terakhir yang memiliki aktivitas komentar
    sorted_dates = sorted(by_date.keys())
    if days > 0 and len(sorted_dates) < min(days, 5):
        with get_db_connection() as conn:
            all_rows = conn.execute(
                """
                SELECT SUBSTR(published_at, 1, 10) AS tanggal,
                       sentimen_prediksi AS sentimen,
                       COUNT(*) AS jumlah
                FROM comments
                WHERE published_at IS NOT NULL AND published_at != ''
                GROUP BY tanggal, sentimen_prediksi
                ORDER BY tanggal ASC
                """
            ).fetchall()
        by_date = {}
        for r in all_rows:
            tgl = r["tanggal"]
            if not tgl:
                continue
            by_date.setdefault(tgl, {"Positif": 0, "Netral": 0, "Negatif": 0})
            if r["sentimen"] in by_date[tgl]:
                by_date[tgl][r["sentimen"]] = int(r["jumlah"])
        sorted_dates = sorted(by_date.keys())[-days:]

    return {
        "days": days,
        "series": [
            {
                "date": d,
                "Positif": by_date[d]["Positif"],
                "Netral": by_date[d]["Netral"],
                "Negatif": by_date[d]["Negatif"],
            }
            for d in sorted_dates
        ],
    }


@app.get("/api/top-words")
def get_top_words(
    sentiment: Optional[str] = Query(None, description="Positif, Netral, atau Negatif (kosong = semua kelas)"),
    limit: int = Query(15, ge=5, le=50),
):
    """Mengambil daftar kata yang paling sering muncul untuk tiap kelas sentimen."""
    classes = [sentiment] if sentiment in ("Positif", "Netral", "Negatif") else ["Positif", "Netral", "Negatif"]
    result = {}

    with get_db_connection() as conn:
        for cls in classes:
            rows = conn.execute(
                "SELECT text_bersih FROM comments WHERE sentimen_prediksi = ?",
                (cls,),
            ).fetchall()
            counter: Counter = Counter()
            for r in rows:
                words = [
                    w for w in str(r["text_bersih"]).split()
                    if len(w) > 2 and w not in STOPWORDS_ID
                ]
                counter.update(words)
            result[cls] = [{"word": w, "count": c} for w, c in counter.most_common(limit)]

    return result


@app.get("/api/comments")
def get_comments(
    q: str = Query("", description="Kata kunci pencarian komentar"),
    sentiment: str = Query("", description="Filter sentimen: Positif, Netral, Negatif"),
    sort: str = Query("d", description="Urutan: d=Terbaru, l=Likes terbanyak, c=Confidence tertinggi"),
    days: int = Query(0, description="Filter N hari terakhir (0 = Semua data)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(8, ge=1, le=100),
):
    """Mengambil daftar komentar dengan fitur pencarian, filter sentimen, pengurutan, dan paginasi."""
    where_clauses = ["1=1"]
    params: list = []

    with get_db_connection() as conn:
        if days > 0:
            date_sql, date_params = build_date_filter_clause(conn, days)
            where_clauses.append(date_sql.replace(" AND ", ""))
            params.extend(date_params)

        if sentiment in ("Positif", "Netral", "Negatif"):
            where_clauses.append("sentimen_prediksi = ?")
            params.append(sentiment)

        if q.strip():
            where_clauses.append("(LOWER(comment_asli) LIKE ? OR LOWER(text_bersih) LIKE ?)")
            kw = f"%{q.strip().lower()}%"
            params.extend([kw, kw])

        where_sql = " AND ".join(where_clauses)

        order_map = {
            "l": "likes DESC, id DESC",
            "c": "confidence_pct DESC, id DESC",
            "d": "published_at DESC, id DESC",
        }
        order_sql = order_map.get(sort, "published_at DESC, id DESC")

        total_row = conn.execute(
            f"SELECT COUNT(*) AS cnt FROM comments WHERE {where_sql}",
            params,
        ).fetchone()
        total = int(total_row["cnt"]) if total_row else 0

        offset = (page - 1) * page_size
        rows = conn.execute(
            f"""
            SELECT id, author, comment_asli, text_bersih, published_at, likes,
                   sentimen_prediksi AS sentimen, confidence_pct
            FROM comments
            WHERE {where_sql}
            ORDER BY {order_sql}
            LIMIT ? OFFSET ?
            """,
            [*params, page_size, offset],
        ).fetchall()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
        "items": [dict(r) for r in rows],
    }


@app.get("/api/random-comments")
def get_random_comments(limit: int = Query(1, ge=1, le=12, description="Jumlah komentar acak dari dataset")):
    """Mengambil komentar secara acak langsung dari dataset MBG."""
    with get_db_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, author, comment_asli, sentimen_prediksi AS sentimen, likes
            FROM comments
            WHERE comment_asli IS NOT NULL AND TRIM(comment_asli) != ''
            ORDER BY RANDOM()
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return {"items": [dict(r) for r in rows]}


@app.get("/api/model-metrics")
def get_model_metrics():
    """Mengambil metrik evaluasi model FastText + BiLSTM dari model_metrics.json."""
    if not os.path.exists(CFG.metrics_json_path):
        raise HTTPException(status_code=404, detail="File model_metrics.json belum tersedia.")
    with open(CFG.metrics_json_path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.post("/api/predict")
def predict_single_comment(payload: PredictRequest):
    """Memprediksi sentimen 1 komentar secara real-time menggunakan model FastText + BiLSTM."""
    df_res = predict_sentiment(
        [payload.text],
        model=ml_state.get("model"),
        tokenizer=ml_state.get("tokenizer"),
        cfg=CFG,
    )
    row = df_res.iloc[0]
    return {
        "teks_asli": row["teks_asli"],
        "teks_bersih": row["teks_bersih"],
        "sentimen": row["sentimen"],
        "confidence_pct": float(row["confidence_pct"]),
        "probabilitas": {
            "Positif": float(row["prob_positif"]),
            "Netral": float(row["prob_netral"]),
            "Negatif": float(row["prob_negatif"]),
        },
    }


@app.post("/api/predict-batch")
async def predict_batch_csv(file: UploadFile = File(...)):
    """Menerima unggahan file CSV dan menjalankan prediksi sentimen massal dengan BiLSTM."""
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File harus berformat .csv")

    raw_bytes = await file.read()
    if len(raw_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 5 MB.")

    try:
        df_in = pd.read_csv(io.BytesIO(raw_bytes))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Gagal membaca CSV: {exc}")

    # Cari kolom komentar ('comment', 'komentar', 'teks', atau kolom string pertama)
    col_candidates = [c for c in df_in.columns if c.lower() in ("comment", "komentar", "teks", "text", "comment_asli")]
    text_col = col_candidates[0] if col_candidates else df_in.select_dtypes(include="object").columns[0]

    df_valid = df_in.dropna(subset=[text_col]).head(5000).copy()
    texts = df_valid[text_col].astype(str).tolist()
    if not texts:
        raise HTTPException(status_code=400, detail="Tidak ada baris komentar yang valid di dalam CSV.")

    df_pred = predict_sentiment(
        texts,
        model=ml_state.get("model"),
        tokenizer=ml_state.get("tokenizer"),
        cfg=CFG,
    )

    counts = df_pred["sentimen"].value_counts().to_dict()
    return {
        "filename": file.filename,
        "text_column": text_col,
        "total_predicted": len(df_pred),
        "summary": {
            "Positif": int(counts.get("Positif", 0)),
            "Netral": int(counts.get("Netral", 0)),
            "Negatif": int(counts.get("Negatif", 0)),
        },
        "items": df_pred.to_dict(orient="records"),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
