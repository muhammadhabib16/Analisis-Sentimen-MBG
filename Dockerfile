# ==============================================================================
# Dockerfile — Backend FastAPI + Pure FastText & BiLSTM Model Serving (API Only)
# Frontend React di-deploy terpisah (mis. di Vercel) dengan env VITE_API_BASE
# ==============================================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TF_CPP_MIN_LOG_LEVEL=2 \
    HOST=0.0.0.0 \
    PORT=8000

WORKDIR /app

# Install dependensi server ramping (tanpa library training/plotting)
COPY requirements-server.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements-server.txt

# Salin hanya kode backend, pipeline inference, dan artefak model
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY artifacts/ ./artifacts/

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)" || exit 1

# Gunakan 1 worker agar model TensorFlow hanya dimuat 1 kali ke RAM
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
