# Use a lightweight Python image
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Copy requirements first (for caching)
COPY . .

# Install system dependencies (ffmpeg + required tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install FastAPI and Uvicorn
RUN pip install uvicorn uv

# Install dependencies using UV
RUN uv sync --frozen --no-dev

# Run FastAPI on 0.0.0.0:80
CMD ["uv", "run", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "80"]
