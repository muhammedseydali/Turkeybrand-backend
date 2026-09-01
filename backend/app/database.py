import os
import re
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# DATABASE_URL examples:
#   local dev (default):  sqlite:///./turkeybrand.db
#   Postgres (Neon/Supabase/RDS/etc):  postgresql+psycopg2://user:pass@host/dbname
raw_url = os.getenv("DATABASE_URL", "sqlite:///./turkeybrand.db").strip()

# Strip any surrounding quotes
if (raw_url.startswith("'") and raw_url.endswith("'")) or (raw_url.startswith('"') and raw_url.endswith('"')):
    raw_url = raw_url[1:-1].strip()

# Normalize Postgres driver protocol for SQLAlchemy + psycopg2
if raw_url.startswith("postgres://"):
    raw_url = "postgresql+psycopg2://" + raw_url[len("postgres://"):]
elif raw_url.startswith("postgresql://"):
    raw_url = "postgresql+psycopg2://" + raw_url[len("postgresql://"):]

# Remove unsupported channel_binding parameter if present
if "channel_binding=" in raw_url:
    raw_url = re.sub(r'[&?]channel_binding=[^&]*', '', raw_url)
    if "?" not in raw_url and "&" in raw_url:
        raw_url = raw_url.replace("&", "?", 1)

DATABASE_URL = raw_url

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
IS_SQLITE = DATABASE_URL.startswith("sqlite")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
