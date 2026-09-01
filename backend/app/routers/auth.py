import random
import re
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

OTP_TTL_MINUTES = 5
OTP_RESEND_COOLDOWN_SECONDS = 30
PHONE_RE = re.compile(r"^\d{10}$")


@router.post("/register", response_model=schemas.Token)
def register(payload: schemas.RegisterIn, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    existing = db.query(models.User).filter(func.lower(models.User.email) == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = models.User(
        name=payload.name.strip(),
        email=email_clean,
        password_hash=auth.hash_password(payload.password),
        phone=payload.phone.strip() if payload.phone else None,
        role=models.Role.customer,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.Token(access_token=token, role=user.role.value, name=user.name)


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    password_clean = payload.password.strip()
    user = db.query(models.User).filter(func.lower(models.User.email) == email_clean).first()
    if not user or not auth.verify_password(password_clean, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    token = auth.create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.Token(access_token=token, role=user.role.value, name=user.name)


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ---------- Phone / OTP login ----------
# DEMO NOTE: there is no real SMS gateway wired up here. /otp/request generates a
# code, stores it, and echoes it straight back in the response (`debug_otp`) so the
# login flow works end-to-end in this demo. Before going live, send the code via a
# provider (Twilio, MSG91, etc.) instead, and delete `debug_otp` from the response —
# the same pattern already used for the mock payment gateway in routers/payments.py.

@router.post("/otp/request", response_model=schemas.OTPRequestOut)
def request_otp(payload: schemas.OTPRequestIn, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    if not PHONE_RE.match(phone):
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number")

    recent = (
        db.query(models.OTPCode)
        .filter(models.OTPCode.phone == phone)
        .order_by(models.OTPCode.created_at.desc())
        .first()
    )
    if recent and (datetime.utcnow() - recent.created_at).total_seconds() < OTP_RESEND_COOLDOWN_SECONDS:
        wait = OTP_RESEND_COOLDOWN_SECONDS - int((datetime.utcnow() - recent.created_at).total_seconds())
        raise HTTPException(status_code=429, detail=f"Please wait {wait}s before requesting another OTP")

    code = f"{random.randint(0, 999999):06d}"
    db.add(models.OTPCode(
        phone=phone, code=code, expires_at=datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES),
    ))
    db.commit()

    print(f"[OTP-DEMO] {phone} -> {code} (no SMS gateway configured; not actually sent)")
    return schemas.OTPRequestOut(
        message="OTP sent", expires_in_minutes=OTP_TTL_MINUTES, debug_otp=code,
    )


@router.post("/otp/verify", response_model=schemas.Token)
def verify_otp(payload: schemas.OTPVerifyIn, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    otp = payload.otp.strip()

    record = (
        db.query(models.OTPCode)
        .filter(models.OTPCode.phone == phone, models.OTPCode.consumed.is_(False))
        .order_by(models.OTPCode.created_at.desc())
        .first()
    )
    if not record or record.code != otp:
        raise HTTPException(status_code=400, detail="Incorrect OTP")
    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This OTP has expired — request a new one")

    record.consumed = True

    user = db.query(models.User).filter(models.User.phone == phone).first()
    if not user:
        # First time logging in with this number — create a lightweight customer
        # account. There's no password for phone-only accounts (a random unusable
        # hash is stored); they always sign back in via OTP. Email is a synthetic
        # placeholder since the column is required + unique.
        user = models.User(
            name=f"Customer {phone[-4:]}",
            email=f"phone-{phone}@turkeybrand.local",
            password_hash=auth.hash_password(uuid.uuid4().hex),
            phone=phone,
            role=models.Role.customer,
        )
        db.add(user)
    elif not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    db.commit()
    db.refresh(user)

    token = auth.create_access_token({"sub": str(user.id), "role": user.role.value})
    return schemas.Token(access_token=token, role=user.role.value, name=user.name)
