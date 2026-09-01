"""Vercel serverless entrypoint. Vercel's Python runtime detects the
`app` ASGI callable below and serves it directly — this file changes
nothing about the app itself, it only exists so Vercel has something
under /api to route to.
"""
from app.main import app  # noqa: F401
