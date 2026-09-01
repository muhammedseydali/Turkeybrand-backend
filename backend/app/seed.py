"""Populate the database with realistic demo data.
Run with:  python -m app.seed
"""
import random
from datetime import datetime, timedelta

from .database import Base, engine, SessionLocal
from . import models, auth

random.seed(42)

IMG = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop"
IMG2 = "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&auto=format&fit=crop"

SIZES = ["S", "M", "L", "XL", "XXL"]
COLORS = [("White", "#FFFFFF"), ("Black", "#111111"), ("Blue", "#2563EB"), ("Grey", "#9CA3AF"), ("Maroon", "#7F1D1D")]
MATERIALS = ["100% Cotton", "Cotton-Linen Blend", "Polyester Blend", "Oxford Cotton", "Pima Cotton"]

SHIRTS = [
    "Premium Cotton Casual Shirt", "Classic Oxford Formal Shirt", "Slim Fit Checked Shirt",
    "Linen Summer Shirt", "Denim Casual Shirt", "Striped Business Shirt",
    "Mandarin Collar Shirt", "Flannel Winter Shirt", "White Formal Shirt", "Printed Resort Shirt",
]
TSHIRTS = [
    "Essential Crew Neck Tee", "Graphic Print T-Shirt", "Polo Collar T-Shirt", "Oversized Streetwear Tee",
    "V-Neck Basic Tee", "Henley T-Shirt", "Long Sleeve Tee", "Tie-Dye T-Shirt", "Athletic Performance Tee",
    "Pocket T-Shirt",
]


def slugify(name):
    return "-".join(name.lower().split())


def main():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Lookups
    categories = {name: models.Category(name=name, slug=slugify(name)) for name in ["Shirts", "T-Shirts"]}
    db.add_all(categories.values())

    materials = {name: models.Material(name=name) for name in MATERIALS}
    db.add_all(materials.values())

    sizes = {name: models.Size(name=name, sort_order=i) for i, name in enumerate(SIZES)}
    db.add_all(sizes.values())

    colors = {name: models.Color(name=name, hex_code=hexcode) for name, hexcode in COLORS}
    db.add_all(colors.values())
    db.flush()

    # Admin + demo customers
    admin = models.User(name="Store Admin", email="admin@turkeybrand.dev",
                         password_hash=auth.hash_password("Admin@123"), role=models.Role.admin)
    admin_compat = models.User(name="Store Admin (Legacy)", email="admin@shopforge.dev",
                                password_hash=auth.hash_password("Admin@123"), role=models.Role.admin)
    customers = [
        models.User(name="Rahul Nair", email="rahul@example.com", password_hash=auth.hash_password("password123"),
                    phone="9876543210", role=models.Role.customer),
        models.User(name="Anjali Menon", email="anjali@example.com", password_hash=auth.hash_password("password123"),
                    phone="9876500000", role=models.Role.customer),
        models.User(name="Vishnu Prasad", email="vishnu@example.com", password_hash=auth.hash_password("password123"),
                    phone="9876511111", role=models.Role.customer),
    ]
    db.add(admin)
    db.add(admin_compat)
    db.add_all(customers)
    db.flush()

    def make_product(name, ptype, category, price, stock_plan):
        """stock_plan: 'high' | 'low' | 'out' — controls demo inventory levels."""
        material = random.choice(list(materials.values()))
        sku = f"{ptype.upper()[:2]}-{random.randint(10000, 99999)}"
        sale_price = round(price * 0.85, 2) if random.random() < 0.4 else None
        product = models.Product(
            name=name, slug=slugify(name), description=(
                f"{name} crafted by Turkeybrand from {material.name.lower()} for everyday comfort and a clean, "
                "modern fit. Breathable fabric, precise stitching, built to hold up wash after wash."
            ),
            category_id=categories[category].id, material_id=material.id, brand="Turkeybrand",
            sku=sku, product_type=ptype, price=price, sale_price=sale_price,
            status=models.ProductStatus.active,
            is_new_arrival=random.random() < 0.3, is_best_seller=random.random() < 0.3,
            views=random.randint(10, 500),
        )
        db.add(product)
        db.flush()
        db.add(models.ProductImage(product_id=product.id, image_url=IMG, sort_order=0))
        db.add(models.ProductImage(product_id=product.id, image_url=IMG2, sort_order=1))

        chosen_colors = random.sample(list(colors.values()), k=3)
        variants = []
        for size_name in SIZES:
            for color in chosen_colors:
                if stock_plan == "out":
                    stock = 0
                elif stock_plan == "low":
                    stock = random.choice([0, 2, 3, 4])
                else:
                    stock = random.randint(8, 30)
                sku_v = f"{sku}-{sizes[size_name].id}-{color.id}"
                v = models.ProductVariant(product_id=product.id, size_id=sizes[size_name].id, color_id=color.id,
                                           sku=sku_v, stock_quantity=stock, sold_quantity=random.randint(0, 15))
                db.add(v)
                variants.append(v)
        return product, variants

    all_variants = []
    for i, name in enumerate(SHIRTS):
        plan = "out" if i == 0 else ("low" if i in (1, 2) else "high")
        _, variants = make_product(name, models.ProductType.shirt, "Shirts", round(random.uniform(999, 2499), 2), plan)
        all_variants += variants
    for i, name in enumerate(TSHIRTS):
        plan = "out" if i == 0 else ("low" if i in (1, 2) else "high")
        _, variants = make_product(name, models.ProductType.tshirt, "T-Shirts", round(random.uniform(499, 1499), 2), plan)
        all_variants += variants

    db.flush()

    # Demo orders + payments + inventory transactions
    statuses = [models.OrderStatus.delivered, models.OrderStatus.shipped, models.OrderStatus.processing,
                models.OrderStatus.confirmed, models.OrderStatus.pending, models.OrderStatus.cancelled]
    pay_statuses = {
        models.OrderStatus.delivered: models.PaymentStatus.paid,
        models.OrderStatus.shipped: models.PaymentStatus.paid,
        models.OrderStatus.processing: models.PaymentStatus.paid,
        models.OrderStatus.confirmed: models.PaymentStatus.paid,
        models.OrderStatus.pending: models.PaymentStatus.pending,
        models.OrderStatus.cancelled: models.PaymentStatus.refunded,
    }

    cities_demo = [
        ("Kamaleswaram, Thiruvananthapuram", "Kerala", "695009"),
        ("Kochi", "Kerala", "682001"),
        ("Kozhikode", "Kerala", "673001"),
        ("Chennai", "Tamil Nadu", "600001"),
        ("Coimbatore", "Tamil Nadu", "641001"),
    ]

    in_stock_variants = [v for v in all_variants if v.stock_quantity > 0]
    for i in range(18):
        customer = random.choice(customers)
        status = random.choice(statuses)
        days_ago = random.randint(0, 45)
        created = datetime.utcnow() - timedelta(days=days_ago)
        chosen = random.sample(in_stock_variants, k=random.randint(1, 3))
        city_info = random.choice(cities_demo)

        order = models.Order(
            order_number=models.gen_order_number(), user_id=customer.id, customer_name=customer.name,
            email=customer.email, phone=customer.phone or "9999999999", address="42 Main Road, Flagship Lane",
            city=city_info[0], state=city_info[1], country="India", postal_code=city_info[2],
            subtotal=0, shipping=49, discount=0, tax=0, total=0, status=status, created_at=created,
        )
        db.add(order)
        db.flush()

        subtotal = 0
        for v in chosen:
            qty = random.randint(1, 2)
            price = v.price_override or v.product.sale_price or v.product.price
            subtotal += price * qty
            db.add(models.OrderItem(order_id=order.id, product_id=v.product_id, variant_id=v.id,
                                     product_name=v.product.name, size=v.size.name, color=v.color.name,
                                     quantity=qty, price=price))
        order.subtotal = round(subtotal, 2)
        order.total = round(subtotal + order.shipping, 2)

        db.add(models.Payment(order_id=order.id, payment_gateway="mock",
                               transaction_id=f"TXN-{i:06d}DEMO", amount=order.total,
                               payment_method=random.choice(["card", "upi", "netbanking"]),
                               status=pay_statuses[status], created_at=created))

    db.commit()
    print("Seed complete.")
    print("Admin login: admin@turkeybrand.dev / Admin@123")
    print("Customer login: rahul@example.com / password123")
    db.close()


if __name__ == "__main__":
    main()
