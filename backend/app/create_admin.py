import argparse
from .database import SessionLocal, Base, engine
from . import models, auth


def create_or_update_admin(email: str, password: str, name: str = "Store Admin"):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        email_clean = email.strip().lower()
        user = db.query(models.User).filter(models.User.email == email_clean).first()
        if user:
            user.password_hash = auth.hash_password(password)
            user.role = models.Role.admin
            user.name = name
            user.is_active = True
            db.commit()
            print(f"✅ Updated existing user '{email_clean}' as Admin.")
        else:
            new_admin = models.User(
                name=name,
                email=email_clean,
                password_hash=auth.hash_password(password),
                role=models.Role.admin,
                is_active=True,
            )
            db.add(new_admin)
            db.commit()
            print(f"✅ Successfully created Admin user: {email_clean}")
        print(f"Login at /admin/login with email: {email_clean}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create or update an admin user in Turkeybrand.")
    parser.add_argument("--email", "-e", required=True, help="Admin email address")
    parser.add_argument("--password", "-p", required=True, help="Admin password")
    parser.add_argument("--name", "-n", default="Store Admin", help="Admin display name")
    args = parser.parse_args()
    create_or_update_admin(args.email, args.password, args.name)
