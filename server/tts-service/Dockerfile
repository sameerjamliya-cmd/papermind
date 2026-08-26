FROM python:3.11-slim

# espeak-ng: phonemizer fallback used by kokoro's G2P (misaki)
# libsndfile1: required by soundfile for WAV encoding
RUN apt-get update && apt-get install -y --no-install-recommends \
    espeak-ng \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# CPU-only torch build — the default PyPI wheel bundles CUDA and is ~2GB,
# which is unnecessary (and slow to pull) on Cloud Run's CPU-only runtime.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8080

CMD ["python", "main.py"]
