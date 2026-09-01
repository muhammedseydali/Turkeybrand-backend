from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict


# ---------- Auth ----------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class OTPRequestIn(BaseModel):
    phone: str


class OTPRequestOut(BaseModel):
    message: str
    expires_in_minutes: int
    # DEMO ONLY: no SMS gateway is wired up, so the code is echoed back here so the
    # flow is testable end-to-end. Remove this field once a real gateway sends it.
    debug_otp: str


class OTPVerifyIn(BaseModel):
    phone: str
    otp: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    created_at: datetime


# ---------- Catalog lookups ----------
class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str


class CategoryCreate(BaseModel):
    name: str


class CategoryWithCount(BaseModel):
    id: int
    name: str
    slug: str
    product_count: int


class MaterialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class SizeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class ColorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    hex_code: str


# ---------- Products ----------
class VariantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    size: SizeOut
    color: ColorOut
    sku: str
    stock_quantity: int
    sold_quantity: int
    price_override: Optional[float] = None


class ImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    image_url: str
    sort_order: int


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_name: str
    rating: int
    comment: str
    created_at: datetime


class ProductCard(BaseModel):
    id: int
    name: str
    slug: str
    brand: str
    sku: str
    product_type: str
    price: float
    sale_price: Optional[float]
    status: str
    is_new_arrival: bool
    is_best_seller: bool
    total_stock: int
    thumbnail: Optional[str] = None
    category: Optional[str] = None
    material: Optional[str] = None


class ProductDetail(BaseModel):
    id: int
    name: str
    slug: str
    description: str
    brand: str
    sku: str
    product_type: str
    price: float
    sale_price: Optional[float]
    status: str
    is_new_arrival: bool
    is_best_seller: bool
    created_at: datetime
    category: Optional[CategoryOut] = None
    material: Optional[MaterialOut] = None
    images: List[ImageOut] = []
    variants: List[VariantOut] = []
    reviews: List[ReviewOut] = []


class ProductListResponse(BaseModel):
    items: List[ProductCard]
    total: int
    page: int
    page_size: int
    total_pages: int


class VariantIn(BaseModel):
    size_id: int
    color_id: int
    stock_quantity: int = 0
    price_override: Optional[float] = None


class ProductCreate(BaseModel):
    name: str
    description: str = ""
    category_id: Optional[int] = None
    material_id: Optional[int] = None
    brand: str = "Turkeybrand"
    sku: str
    product_type: str  # "shirt" | "tshirt"
    price: float
    sale_price: Optional[float] = None
    status: str = "active"
    is_new_arrival: bool = False
    is_best_seller: bool = False
    image_urls: List[str] = []
    variants: List[VariantIn] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    material_id: Optional[int] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    sale_price: Optional[float] = None
    status: Optional[str] = None
    is_new_arrival: Optional[bool] = None
    is_best_seller: Optional[bool] = None
    image_urls: Optional[List[str]] = None
    variants: Optional[List[VariantIn]] = None


# ---------- Cart / Checkout ----------
class CartLineIn(BaseModel):
    variant_id: int
    quantity: int


class CheckoutIn(BaseModel):
    customer_name: str
    email: EmailStr
    phone: str
    address: str
    city: str
    state: str
    country: str
    postal_code: str
    items: List[CartLineIn]
    payment_method: str = "card"
    shipping: float = 0
    discount: float = 0
    tax: float = 0


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_name: str
    size: str
    color: str
    quantity: int
    price: float


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    payment_gateway: str
    transaction_id: str
    amount: float
    payment_method: str
    status: str
    created_at: datetime


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_number: str
    customer_name: str
    email: str
    subtotal: float
    shipping: float
    discount: float
    tax: float
    total: float
    status: str
    created_at: datetime
    items: List[OrderItemOut] = []
    payment: Optional[PaymentOut] = None


class OrderStatusUpdate(BaseModel):
    status: str


class PaymentStatusUpdate(BaseModel):
    status: str


# ---------- Admin dashboard ----------
class DashboardOverview(BaseModel):
    total_sales: float
    today_sales: float
    monthly_sales: float
    total_orders: int
    pending_orders: int
    completed_orders: int
    total_products: int
    low_stock_products: int
    out_of_stock_products: int
    total_customers: int


class CustomerOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    orders_count: int
    total_spent: float
    last_order: Optional[datetime]
    is_active: bool
    created_at: datetime


class InventoryRow(BaseModel):
    variant_id: int
    product_name: str
    sku: str
    size: str
    color: str
    stock_quantity: int
    sold_quantity: int
    low_stock: bool
