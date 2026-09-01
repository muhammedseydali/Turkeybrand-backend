import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum, UniqueConstraint
)
from sqlalchemy.orm import relationship

from .database import Base


def gen_order_number():
    return "ORD-" + uuid.uuid4().hex[:10].upper()


class Role(str, enum.Enum):
    customer = "customer"
    admin = "admin"


class ProductType(str, enum.Enum):
    shirt = "shirt"
    tshirt = "tshirt"


class ProductStatus(str, enum.Enum):
    active = "active"
    draft = "draft"
    archived = "archived"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"
    returned = "returned"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"
    cancelled = "cancelled"


class InventoryTxnType(str, enum.Enum):
    purchase = "purchase"
    sale = "sale"
    return_ = "return"
    adjustment = "adjustment"
    cancellation = "cancellation"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=True, index=True)
    role = Column(Enum(Role), default=Role.customer, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False)

    products = relationship("Product", back_populates="category")


class Material(Base):
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)

    products = relationship("Product", back_populates="material")


class Size(Base):
    __tablename__ = "sizes"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)  # S, M, L, XL, XXL
    sort_order = Column(Integer, default=0)


class Color(Base):
    __tablename__ = "colors"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    hex_code = Column(String, nullable=False)


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=False, default="")
    category_id = Column(Integer, ForeignKey("categories.id"))
    material_id = Column(Integer, ForeignKey("materials.id"))
    brand = Column(String, default="Turkeybrand")
    sku = Column(String, unique=True, nullable=False)
    product_type = Column(Enum(ProductType), nullable=False)
    price = Column(Float, nullable=False)
    sale_price = Column(Float, nullable=True)
    status = Column(Enum(ProductStatus), default=ProductStatus.active)
    is_new_arrival = Column(Boolean, default=False)
    is_best_seller = Column(Boolean, default=False)
    views = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    material = relationship("Material", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.sort_order")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")

    @property
    def total_stock(self):
        return sum(v.stock_quantity for v in self.variants)


class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    image_url = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)

    product = relationship("Product", back_populates="images")


class ProductVariant(Base):
    __tablename__ = "product_variants"
    __table_args__ = (UniqueConstraint("product_id", "size_id", "color_id", name="uq_variant"),)
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    size_id = Column(Integer, ForeignKey("sizes.id"))
    color_id = Column(Integer, ForeignKey("colors.id"))
    sku = Column(String, unique=True, nullable=False)
    stock_quantity = Column(Integer, default=0, nullable=False)
    sold_quantity = Column(Integer, default=0, nullable=False)
    price_override = Column(Float, nullable=True)

    product = relationship("Product", back_populates="variants")
    size = relationship("Size")
    color = relationship("Color")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    customer_name = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="reviews")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    order_number = Column(String, unique=True, default=gen_order_number)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    customer_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    country = Column(String, nullable=False)
    postal_code = Column(String, nullable=False)

    subtotal = Column(Float, nullable=False)
    shipping = Column(Float, default=0)
    discount = Column(Float, default=0)
    tax = Column(Float, default=0)
    total = Column(Float, nullable=False)

    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    variant_id = Column(Integer, ForeignKey("product_variants.id"))
    product_name = Column(String, nullable=False)
    size = Column(String, nullable=False)
    color = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True)
    payment_gateway = Column(String, default="mock")
    transaction_id = Column(String, unique=True, default=lambda: "TXN-" + uuid.uuid4().hex[:12].upper())
    amount = Column(Float, nullable=False)
    payment_method = Column(String, default="card")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="payment")


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"
    id = Column(Integer, primary_key=True)
    product_variant_id = Column(Integer, ForeignKey("product_variants.id"))
    transaction_type = Column(Enum(InventoryTxnType), nullable=False)
    quantity = Column(Integer, nullable=False)  # negative = stock leaving, positive = stock coming in
    reference_id = Column(String, nullable=True)  # e.g. order_number
    notes = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class OTPCode(Base):
    """One-time passcodes for phone-based customer login.
    DEMO NOTE: no real SMS gateway is wired up — see routers/auth.py."""
    __tablename__ = "otp_codes"
    id = Column(Integer, primary_key=True)
    phone = Column(String, nullable=False, index=True)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    consumed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
