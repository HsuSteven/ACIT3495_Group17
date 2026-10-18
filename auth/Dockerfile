FROM python:3.14-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install connexion[uvicorn]

COPY *.py /service/
COPY auth.yaml /service/
WORKDIR /service

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]