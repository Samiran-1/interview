# Stage 1: Build & Dependency Resolution Layer
FROM python:3.11-slim as builder

# Install core build dependencies for Python C-extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    ffmpeg \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/root/.local/bin:$PATH"

WORKDIR /build

# Mocking Installation pipeline (Using standard pip vs Poetry for clean CI/CD orchestration)
# This layer builds native wheels (asyncpg, numpy, Passlib) before shedding weight
# RUN pip install --no-cache-dir \
#     fastapi uvicorn[standard] sqlalchemy asyncpg \
#     alembic python-jose[cryptography] passlib[bcrypt] \
#     pydantic[email] opencv-python-headless numpy \
#     celery redis python-multipart pdfplumber httpx openai \
#     livekit-api livekit-agents==0.12.3 \
#     livekit-plugins-openai==0.12.1 \
#     faster-whisper edge-tts

# 1. Core API & Database (Requires C-compilers sometimes)
RUN pip install --no-cache-dir fastapi uvicorn[standard] sqlalchemy asyncpg alembic

# 2. Security & Utilities
RUN pip install --no-cache-dir python-jose[cryptography] passlib[bcrypt,argon2] "bcrypt==3.2.2" python-multipart pydantic[email]

# 3. Data Processing & Background Tasks
RUN pip install --no-cache-dir celery redis pdfplumber httpx opencv-python-headless numpy

# 4. AI & Audio
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir openai "livekit-api<1.0" "livekit-agents<1.0" "livekit-plugins-openai<1.0" "livekit-plugins-silero<1.0"
RUN pip install --no-cache-dir faster-whisper edge-tts

# Pre-download the Whisper AI model into the Docker image so it boots instantly
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('base.en', device='cpu', compute_type='int8')"

# Stage 2: Production Runtime Environment
FROM python:3.11-slim

WORKDIR /app

# CRITICAL SYSTEMS REQUIREMENT: OpenCV Prototyping
# OpenCV's headless implementation heavily relies on OS-level C++ rendering libraries.
# Failing to map libgl1 and libglib2 will instantly crash the Proctoring Endpoint with an ImportError.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Map compiled binaries & site-packages from the heavy builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# Mount App Source
COPY . .

# Security Best Practice: Delegate execution to a non-root User
RUN useradd -m celeryuser && chown -R celeryuser /app
USER celeryuser

# Map ASGI Port
EXPOSE 8000

# Container Default Execution (API Gateway - Overridden inside compose.yml for Workers)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--proxy-headers"]
