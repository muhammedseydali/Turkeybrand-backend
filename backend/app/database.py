import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# DATABASE_URL examples:
#   local dev (default):  sqlite:///./turkeybrand.db
#   Postgres (Neon/Supabase/RDS/etc):  postgresql+psycopg2://user:pass@host/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./turkeybrand.db")

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
