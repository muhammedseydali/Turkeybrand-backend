from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas, auth
from ..database import get_db, IS_SQLITE

router = APIRouter(prefix="/api", tags=["orders"])


@router.post("/orders", response_model=schemas.OrderOut)
def create_order(
    payload: schemas.CheckoutIn,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # --- Lock + validate every variant before touching anything (all-or-nothing). ---
    # On Postgres this takes row locks so two simultaneous checkouts for the last unit
    # of a variant can't both succeed. SQLite has no row locking, but its single-writer
    # transaction model still serializes these writes for the demo.
    variants = {}
    subtotal = 0.0
    order_items_data = []

    for line in payload.items:
        q = db.query(models.ProductVariant).filter(models.ProductVariant.id == line.variant_id)
        if not IS_SQLITE:
            q = q.with_for_update()
        variant = q.first()
        if not variant:
            raise HTTPException(status_code=404, detail=f"Product variant {line.variant_id} not found")
        if line.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be positive")
        if variant.stock_quantity < line.quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Only {variant.stock_quantity} left for {variant.product.name} "
                       f"({variant.size.name}/{variant.color.name})",
            )
        variants[line.variant_id] = variant
        unit_price = variant.price_override or variant.product.sale_price or variant.product.price
        subtotal += unit_price * line.quantity
        order_items_data.append((variant, line.quantity, unit_price))

    total = round(subtotal + payload.shipping + payload.tax - payload.discount, 2)

    order = models.Order(
        user_id=current_user.id if current_user else None,
        customer_name=payload.customer_name,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        country=payload.country,
        postal_code=payload.postal_code,
        subtotal=round(subtotal, 2),
        shipping=payload.shipping,
        discount=payload.discount,
        tax=payload.tax,
        total=total,
        status=models.OrderStatus.pending,
    )
    db.add(order)
    db.flush()  # get order.id

    for variant, qty, unit_price in order_items_data:
        db.add(models.OrderItem(
            order_id=order.id, product_id=variant.product_id, variant_id=variant.id,
            product_name=variant.product.name, size=variant.size.name, color=variant.color.name,
            quantity=qty, price=unit_price,
        ))
        # Deduct stock now (reserved at order-creation time) and log the movement.
        variant.stock_quantity -= qty
        variant.sold_quantity += qty
        db.add(models.InventoryTransaction(
            product_variant_id=variant.id, transaction_type=models.InventoryTxnType.sale,
            quantity=-qty, reference_id=order.order_number, notes="Order created",
        ))

    payment = models.Payment(
        order_id=order.id, payment_gateway="mock", amount=total,
        payment_method=payload.payment_method, status=models.PaymentStatus.pending,
    )
    db.add(payment)

    db.commit()
    db.refresh(order)
    return order


@router.get("/orders", response_model=List[schemas.OrderOut])
def my_orders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return (
        db.query(models.Order)
        .options(joinedload(models.Order.items), joinedload(models.Order.payment))
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )


@router.get("/orders/{order_number}", response_model=schemas.OrderOut)
def get_order(order_number: str, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items), joinedload(models.Order.payment))
        .filter(models.Order.order_number == order_number)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order
