# Use a lightweight Python image
FROM python:3.11-slim

# Set working directory inside container
WORKDIR /app

# Copy requirements first (for caching)
COPY . .

# Install FastAPI and Uvicorn
RUN pip install fastapi uvicorn uv

# Install dependencies using UV
RUN uv sync --frozen --no-dev

# Expose port 80
EXPOSE 80

# Run FastAPI on 0.0.0.0:80
CMD ["uv", "run", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "80"]
