#!/bin/sh
set -e

AUTO_SEED="${AUTO_SEED:-true}"

if [ "$AUTO_SEED" = "true" ]; then
  STATUS=$(python -c "
from sqlalchemy import inspect, text
from app.database import engine, Base

Base.metadata.create_all(bind=engine)
insp = inspect(engine)
count = 0
if 'products' in insp.get_table_names():
    with engine.connect() as conn:
        count = conn.execute(text('SELECT COUNT(*) FROM products')).scalar()
print('EMPTY' if not count else 'HASDATA')
")
  echo "Turkeybrand DB status: $STATUS"
  if [ "$STATUS" = "EMPTY" ]; then
    echo "No product data found — seeding demo data (admin@turkeybrand.dev / Admin@123)..."
    python -m app.seed
  fi
fi

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
