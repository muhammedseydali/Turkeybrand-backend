import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import auth as auth_router
from .routers import products, orders, payments, admin

# Auto-create tables if they don't exist yet (fine for demo / first deploy;
# use Alembic migrations for real schema evolution in production).
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Turkeybrand API", version="1.0.1")

cors_origins_env = os.getenv("CORS_ORIGINS", "*").strip()
if cors_origins_env == "*" or not cors_origins_env:
    allow_origins = ["*"]
    allow_origin_regex = r"^https?://.*"
else:
    allow_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    allow_origin_regex = None

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {
        "brand": "Turkeybrand",
        "service": "Turkeybrand Backend API",
        "version": "1.0.1",
        "status": "online",
        "healthcheck": "/api/health",
        "api_docs": "/docs",
        "products_endpoint": "/api/products",
        "note": "This is the backend API. The React storefront runs on Netlify/Vercel."
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
