from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas, auth
from ..database import get_db
from .products import _to_card

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(auth.require_admin)])


# ---------------- Dashboard ----------------
@router.get("/dashboard", response_model=schemas.DashboardOverview)
def dashboard(db: Session = Depends(get_db)):
    paid_orders = db.query(models.Order).join(models.Payment).filter(models.Payment.status == models.PaymentStatus.paid)
    total_sales = paid_orders.with_entities(func.coalesce(func.sum(models.Order.total), 0.0)).scalar()

    today = datetime.utcnow().date()
    month_start = today.replace(day=1)

    today_sales = paid_orders.filter(func.date(models.Order.created_at) == today).with_entities(
        func.coalesce(func.sum(models.Order.total), 0.0)).scalar()
    monthly_sales = paid_orders.filter(models.Order.created_at >= month_start).with_entities(
        func.coalesce(func.sum(models.Order.total), 0.0)).scalar()

    total_orders = db.query(models.Order).count()
    pending_orders = db.query(models.Order).filter(
        models.Order.status.in_([models.OrderStatus.pending, models.OrderStatus.confirmed, models.OrderStatus.processing])
    ).count()
    completed_orders = db.query(models.Order).filter(models.Order.status == models.OrderStatus.delivered).count()

    total_products = db.query(models.Product).count()

    variants = db.query(models.ProductVariant).all()
    low_stock_variant_products = {v.product_id for v in variants if 0 < v.stock_quantity <= 5}
    out_of_stock_products = db.query(models.Product).filter(
        ~models.Product.variants.any(models.ProductVariant.stock_quantity > 0)
    ).count()

    total_customers = db.query(models.User).filter(models.User.role == models.Role.customer).count()

    return schemas.DashboardOverview(
        total_sales=round(total_sales, 2), today_sales=round(today_sales, 2), monthly_sales=round(monthly_sales, 2),
        total_orders=total_orders, pending_orders=pending_orders, completed_orders=completed_orders,
        total_products=total_products, low_stock_products=len(low_stock_variant_products),
        out_of_stock_products=out_of_stock_products, total_customers=total_customers,
    )


# ---------------- Products ----------------
@router.get("/products", response_model=List[schemas.ProductCard])
def admin_list_products(db: Session = Depends(get_db)):
    products = db.query(models.Product).options(joinedload(models.Product.images), joinedload(models.Product.variants),
                                                  joinedload(models.Product.category), joinedload(models.Product.material)).all()
    return [_to_card(p) for p in products]


def _slugify(name: str) -> str:
    return "-".join(name.lower().split())


@router.post("/products", response_model=schemas.ProductDetail)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    if db.query(models.Product).filter(models.Product.sku == payload.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")

    base_slug = _slugify(payload.name)
    slug, i = base_slug, 1
    while db.query(models.Product).filter(models.Product.slug == slug).first():
        i += 1
        slug = f"{base_slug}-{i}"

    product = models.Product(
        name=payload.name, slug=slug, description=payload.description,
        category_id=payload.category_id, material_id=payload.material_id, brand=payload.brand,
        sku=payload.sku, product_type=payload.product_type, price=payload.price,
        sale_price=payload.sale_price, status=payload.status,
        is_new_arrival=payload.is_new_arrival, is_best_seller=payload.is_best_seller,
    )
    db.add(product)
    db.flush()

    for i, url in enumerate(payload.image_urls):
        db.add(models.ProductImage(product_id=product.id, image_url=url, sort_order=i))

    for v in payload.variants:
        sku = f"{payload.sku}-{v.size_id}-{v.color_id}"
        db.add(models.ProductVariant(
            product_id=product.id, size_id=v.size_id, color_id=v.color_id, sku=sku,
            stock_quantity=v.stock_quantity, price_override=v.price_override,
        ))
        db.add(models.InventoryTransaction(
            product_variant_id=None, transaction_type=models.InventoryTxnType.purchase,
            quantity=v.stock_quantity, reference_id=sku, notes="Initial stock on product creation",
        ))

    db.commit()
    db.refresh(product)
    return product


@router.put("/products/{product_id}", response_model=schemas.ProductDetail)
def update_product(product_id: int, payload: schemas.ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    data = payload.model_dump(exclude_unset=True, exclude={"image_urls", "variants"})
    for field, value in data.items():
        setattr(product, field, value)

    if payload.image_urls is not None:
        db.query(models.ProductImage).filter(models.ProductImage.product_id == product.id).delete()
        for i, url in enumerate(payload.image_urls):
            db.add(models.ProductImage(product_id=product.id, image_url=url, sort_order=i))

    if payload.variants is not None:
        existing = {(v.size_id, v.color_id): v for v in product.variants}
        for v in payload.variants:
            key = (v.size_id, v.color_id)
            if key in existing:
                diff = v.stock_quantity - existing[key].stock_quantity
                existing[key].stock_quantity = v.stock_quantity
                existing[key].price_override = v.price_override
                if diff != 0:
                    db.add(models.InventoryTransaction(
                        product_variant_id=existing[key].id, transaction_type=models.InventoryTxnType.adjustment,
                        quantity=diff, reference_id=existing[key].sku, notes="Admin stock adjustment",
                    ))
            else:
                sku = f"{product.sku}-{v.size_id}-{v.color_id}"
                new_variant = models.ProductVariant(
                    product_id=product.id, size_id=v.size_id, color_id=v.color_id, sku=sku,
                    stock_quantity=v.stock_quantity, price_override=v.price_override,
                )
                db.add(new_variant)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"ok": True}


@router.post("/products/{product_id}/toggle-status")
def toggle_status(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.status = (
        models.ProductStatus.archived if product.status == models.ProductStatus.active else models.ProductStatus.active
    )
    db.commit()
    return {"status": product.status.value}


# ---------------- Categories ----------------
@router.get("/categories", response_model=List[schemas.CategoryWithCount])
def admin_list_categories(db: Session = Depends(get_db)):
    categories = db.query(models.Category).order_by(models.Category.name).all()
    counts = dict(
        db.query(models.Product.category_id, func.count(models.Product.id))
        .group_by(models.Product.category_id)
        .all()
    )
    return [
        schemas.CategoryWithCount(id=c.id, name=c.name, slug=c.slug, product_count=counts.get(c.id, 0))
        for c in categories
    ]


@router.post("/categories", response_model=schemas.CategoryOut)
def create_category(payload: schemas.CategoryCreate, db: Session = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required")
    if db.query(models.Category).filter(models.Category.name.ilike(name)).first():
        raise HTTPException(status_code=400, detail="A category with this name already exists")

    base_slug = _slugify(name)
    slug, i = base_slug, 1
    while db.query(models.Category).filter(models.Category.slug == slug).first():
        i += 1
        slug = f"{base_slug}-{i}"

    category = models.Category(name=name, slug=slug)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    active_count = (
        db.query(models.Product)
        .filter(models.Product.category_id == category_id, models.Product.status == models.ProductStatus.active)
        .count()
    )
    if active_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Can't delete — {active_count} active product(s) still use this category. "
                   f"Reassign or archive them first.",
        )

    db.delete(category)
    db.commit()
    return {"ok": True}


# ---------------- Orders ----------------
@router.get("/orders", response_model=List[schemas.OrderOut])
def admin_list_orders(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Order).options(joinedload(models.Order.items), joinedload(models.Order.payment))
    if status:
        q = q.filter(models.Order.status == status)
    return q.order_by(models.Order.created_at.desc()).all()


@router.put("/orders/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(order_id: int, payload: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).options(joinedload(models.Order.items), joinedload(models.Order.payment)).filter(
        models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


# ---------------- Payments ----------------
@router.get("/payments", response_model=List[schemas.PaymentOut])
def admin_list_payments(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Payment)
    if status:
        q = q.filter(models.Payment.status == status)
    return q.order_by(models.Payment.created_at.desc()).all()


@router.put("/payments/{payment_id}/status", response_model=schemas.PaymentOut)
def update_payment_status(payment_id: int, payload: schemas.PaymentStatusUpdate, db: Session = Depends(get_db)):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    payment.status = payload.status
    db.commit()
    db.refresh(payment)
    return payment


# ---------------- Customers ----------------
@router.get("/customers", response_model=List[schemas.CustomerOut])
def admin_list_customers(db: Session = Depends(get_db)):
    customers = db.query(models.User).filter(models.User.role == models.Role.customer).all()
    result = []
    for c in customers:
        orders = c.orders
        spent = sum(o.total for o in orders if o.payment and o.payment.status == models.PaymentStatus.paid)
        last_order = max((o.created_at for o in orders), default=None)
        result.append(schemas.CustomerOut(
            id=c.id, name=c.name, email=c.email, phone=c.phone, orders_count=len(orders),
            total_spent=round(spent, 2), last_order=last_order, is_active=c.is_active, created_at=c.created_at,
        ))
    return result


@router.get("/customers/{customer_id}/orders", response_model=List[schemas.OrderOut])
def customer_orders(customer_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Order)
        .options(joinedload(models.Order.items), joinedload(models.Order.payment))
        .filter(models.Order.user_id == customer_id)
        .order_by(models.Order.created_at.desc())
        .all()
    )


# ---------------- Inventory ----------------
@router.get("/inventory", response_model=List[schemas.InventoryRow])
def admin_inventory(low_stock_only: bool = False, db: Session = Depends(get_db)):
    variants = db.query(models.ProductVariant).options(
        joinedload(models.ProductVariant.product), joinedload(models.ProductVariant.size),
        joinedload(models.ProductVariant.color),
    ).all()
    rows = [
        schemas.InventoryRow(
            variant_id=v.id, product_name=v.product.name, sku=v.sku, size=v.size.name, color=v.color.name,
            stock_quantity=v.stock_quantity, sold_quantity=v.sold_quantity,
            low_stock=0 < v.stock_quantity <= 5,
        )
        for v in variants
    ]
    if low_stock_only:
        rows = [r for r in rows if r.low_stock or r.stock_quantity == 0]
    return rows


# ---------------- Reports ----------------
@router.get("/reports/sales")
def sales_report(
    range: str = Query("this_month", description="today|yesterday|this_week|this_month|last_month|this_year|custom"),
    start: Optional[str] = None,
    end: Optional[str] = None,
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    today = now.date()

    if range == "today":
        date_from, date_to = today, today
    elif range == "yesterday":
        y = today - timedelta(days=1)
        date_from, date_to = y, y
    elif range == "this_week":
        date_from, date_to = today - timedelta(days=today.weekday()), today
    elif range == "this_month":
        date_from, date_to = today.replace(day=1), today
    elif range == "last_month":
        first_this = today.replace(day=1)
        last_month_end = first_this - timedelta(days=1)
        date_from, date_to = last_month_end.replace(day=1), last_month_end
    elif range == "this_year":
        date_from, date_to = today.replace(month=1, day=1), today
    elif range == "custom" and start and end:
        date_from, date_to = datetime.fromisoformat(start).date(), datetime.fromisoformat(end).date()
    else:
        date_from, date_to = today.replace(day=1), today

    orders = (
        db.query(models.Order)
        .options(joinedload(models.Order.items), joinedload(models.Order.payment))
        .filter(func.date(models.Order.created_at) >= date_from, func.date(models.Order.created_at) <= date_to)
        .filter(models.Order.payment.has(models.Payment.status == models.PaymentStatus.paid))
        .all()
    )

    total_revenue = sum(o.total for o in orders)
    num_orders = len(orders)
    avg_order_value = round(total_revenue / num_orders, 2) if num_orders else 0

    units_sold = 0
    product_sales, size_sales, sales_by_day = {}, {}, {}
    for o in orders:
        day_key = o.created_at.date().isoformat()
        sales_by_day[day_key] = sales_by_day.get(day_key, 0) + o.total
        for item in o.items:
            units_sold += item.quantity
            product_sales[item.product_name] = product_sales.get(item.product_name, 0) + item.quantity
            size_sales[item.size] = size_sales.get(item.size, 0) + item.quantity

    best_selling = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "range": {"from": date_from.isoformat(), "to": date_to.isoformat()},
        "total_revenue": round(total_revenue, 2),
        "num_orders": num_orders,
        "avg_order_value": avg_order_value,
        "units_sold": units_sold,
        "best_selling_products": [{"name": n, "units": u} for n, u in best_selling],
        "sales_by_day": [{"date": d, "revenue": round(v, 2)} for d, v in sorted(sales_by_day.items())],
        "sales_by_size": [{"size": s, "units": u} for s, u in size_sales.items()],
    }
