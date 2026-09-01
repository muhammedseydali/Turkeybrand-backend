FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh && mkdir -p /app/data

ENV PORT=8000
# Default DB path lives on a volume mount point so data survives container restarts/rebuilds.
ENV DATABASE_URL=sqlite:////app/data/turkeybrand.db

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
