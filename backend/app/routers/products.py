import math
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api", tags=["catalog"])


def _to_card(p: models.Product) -> schemas.ProductCard:
    thumb = p.images[0].image_url if p.images else None
    return schemas.ProductCard(
        id=p.id, name=p.name, slug=p.slug, brand=p.brand, sku=p.sku,
        product_type=p.product_type.value, price=p.price, sale_price=p.sale_price,
        status=p.status.value, is_new_arrival=p.is_new_arrival, is_best_seller=p.is_best_seller,
        total_stock=p.total_stock, thumbnail=thumb,
        category=p.category.name if p.category else None,
        material=p.material.name if p.material else None,
    )


@router.get("/products", response_model=schemas.ProductListResponse)
def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    product_type: Optional[str] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
    material: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    availability: Optional[str] = Query(None, description="in_stock | out_of_stock"),
    new_arrivals: Optional[bool] = None,
    best_sellers: Optional[bool] = None,
    sort: Optional[str] = Query(None, description="price_asc|price_desc|newest|popular|best_selling"),
    page: int = 1,
    page_size: int = 12,
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.Product)
        .options(joinedload(models.Product.images), joinedload(models.Product.category),
                 joinedload(models.Product.material), joinedload(models.Product.variants))
        .filter(models.Product.status == models.ProductStatus.active)
    )

    if q:
        like = f"%{q}%"
        query = query.join(models.Material, isouter=True).filter(
            or_(models.Product.name.ilike(like), models.Product.sku.ilike(like),
                models.Material.name.ilike(like))
        )
    if category:
        query = query.join(models.Category).filter(models.Category.slug == category)
    if product_type:
        query = query.filter(models.Product.product_type == product_type)
    if material:
        query = query.join(models.Material, isouter=True).filter(models.Material.name.ilike(material))
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)
    if new_arrivals:
        query = query.filter(models.Product.is_new_arrival.is_(True))
    if best_sellers:
        query = query.filter(models.Product.is_best_seller.is_(True))

    products = query.all()

    # Variant-level filters (size/color/availability) done in python since it's per-variant
    if size:
        products = [p for p in products if any(v.size.name.lower() == size.lower() and v.stock_quantity > 0 for v in p.variants)]
    if color:
        products = [p for p in products if any(v.color.name.lower() == color.lower() for v in p.variants)]
    if availability == "in_stock":
        products = [p for p in products if p.total_stock > 0]
    elif availability == "out_of_stock":
        products = [p for p in products if p.total_stock == 0]

    if sort == "price_asc":
        products.sort(key=lambda p: p.sale_price or p.price)
    elif sort == "price_desc":
        products.sort(key=lambda p: p.sale_price or p.price, reverse=True)
    elif sort == "newest":
        products.sort(key=lambda p: p.created_at, reverse=True)
    elif sort == "popular":
        products.sort(key=lambda p: p.views, reverse=True)
    elif sort == "best_selling":
        products.sort(key=lambda p: sum(v.sold_quantity for v in p.variants), reverse=True)

    total = len(products)
    total_pages = max(1, math.ceil(total / page_size))
    start = (page - 1) * page_size
    page_items = products[start:start + page_size]

    return schemas.ProductListResponse(
        items=[_to_card(p) for p in page_items], total=total, page=page,
        page_size=page_size, total_pages=total_pages,
    )


@router.get("/products/{slug}", response_model=schemas.ProductDetail)
def get_product(slug: str, db: Session = Depends(get_db)):
    p = (
        db.query(models.Product)
        .options(joinedload(models.Product.images), joinedload(models.Product.category),
                 joinedload(models.Product.material),
                 joinedload(models.Product.variants).joinedload(models.ProductVariant.size),
                 joinedload(models.Product.variants).joinedload(models.ProductVariant.color),
                 joinedload(models.Product.reviews))
        .filter(models.Product.slug == slug)
        .first()
    )
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    p.views = (p.views or 0) + 1
    db.commit()
    return p


@router.get("/products/{slug}/related", response_model=List[schemas.ProductCard])
def related_products(slug: str, db: Session = Depends(get_db)):
    p = db.query(models.Product).filter(models.Product.slug == slug).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    related = (
        db.query(models.Product)
        .options(joinedload(models.Product.images))
        .filter(models.Product.category_id == p.category_id, models.Product.id != p.id,
                models.Product.status == models.ProductStatus.active)
        .limit(4)
        .all()
    )
    return [_to_card(r) for r in related]


@router.get("/categories", response_model=List[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


@router.get("/materials", response_model=List[schemas.MaterialOut])
def list_materials(db: Session = Depends(get_db)):
    return db.query(models.Material).all()


@router.get("/sizes", response_model=List[schemas.SizeOut])
def list_sizes(db: Session = Depends(get_db)):
    return db.query(models.Size).order_by(models.Size.sort_order).all()


@router.get("/colors", response_model=List[schemas.ColorOut])
def list_colors(db: Session = Depends(get_db)):
    return db.query(models.Color).all()
