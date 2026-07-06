FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 PYTHONPATH=/app/src IL_DATA_DIR=/app/data

# core deps only — the image runs the full system on stub backends.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY pyproject.toml README.md ./
COPY src ./src

# build the sample index at image-build time so the container is query-ready.
RUN python -m insightledger.cli bootstrap && \
    python -c "from insightledger.eval.golden_set import write_golden; write_golden()"

EXPOSE 8000
CMD ["python", "-m", "insightledger.cli", "serve", "--host", "0.0.0.0", "--port", "8000"]
