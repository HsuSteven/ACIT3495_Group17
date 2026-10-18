FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


FROM python:3.12-slim

WORKDIR /app

# create dedicated non-root user and group
RUN groupadd -r appgroup && useradd -r -g appgroup -u 1001 appuser

# Copy installed packages from builder stage
COPY --from=builder /install /usr/local
COPY analytics.py /app/

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app
USER appuser

# Health check to ensure the Python runtime loop is active
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import os; exit(0 if os.path.exists('/app/analytics.py') else 1)"

CMD ["python", "analytics.py"]