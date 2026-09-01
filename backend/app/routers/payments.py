from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api", tags=["payments"])


def _restore_stock(db: Session, order: models.Order, txn_type: models.InventoryTxnType, note: str):
    for item in order.items:
        variant = db.query(models.ProductVariant).filter(models.ProductVariant.id == item.variant_id).first()
        if variant:
            variant.stock_quantity += item.quantity
            variant.sold_quantity = max(0, variant.sold_quantity - item.quantity)
            db.add(models.InventoryTransaction(
                product_variant_id=variant.id, transaction_type=txn_type,
                quantity=item.quantity, reference_id=order.order_number, notes=note,
            ))


@router.post("/payments/{order_number}/pay", response_model=schemas.OrderOut)
def pay_order(order_number: str, db: Session = Depends(get_db)):
    """Mock payment gateway. Swap this for a real Razorpay/Stripe call —
    the rest of the pipeline (order + inventory) is unaffected either way."""
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items), joinedload(models.Order.payment))
        .filter(models.Order.order_number == order_number)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if not order.payment:
        raise HTTPException(status_code=400, detail="No payment record for this order")
    if order.payment.status == models.PaymentStatus.paid:
        return order

    # Simulated gateway: always succeeds in the demo.
    order.payment.status = models.PaymentStatus.paid
    order.status = models.OrderStatus.confirmed
    db.commit()
    db.refresh(order)
    return order


@router.post("/orders/{order_number}/cancel", response_model=schemas.OrderOut)
def cancel_order(order_number: str, db: Session = Depends(get_db)):
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items), joinedload(models.Order.payment))
        .filter(models.Order.order_number == order_number)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status in (models.OrderStatus.cancelled, models.OrderStatus.delivered):
        raise HTTPException(status_code=400, detail=f"Order already {order.status.value}")

    _restore_stock(db, order, models.InventoryTxnType.cancellation, "Order cancelled")
    order.status = models.OrderStatus.cancelled
    if order.payment and order.payment.status == models.PaymentStatus.paid:
        order.payment.status = models.PaymentStatus.refunded
    else:
        order.payment.status = models.PaymentStatus.cancelled

    db.commit()
    db.refresh(order)
    return order
