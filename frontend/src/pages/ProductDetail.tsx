import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, ProductDetail as ProductDetailT, ProductCard as ProductCardT, money } from "../api";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import ProductCard from "../components/ProductCard";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addLine } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState<ProductDetailT | null>(null);
  const [related, setRelated] = useState<ProductCardT[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!slug) return;
    api.get(`/api/products/${slug}`).then((r) => {
      setProduct(r.data);
      setSelectedColor(r.data.variants[0]?.color.name ?? null);
      setSelectedSize(null);
      setActiveImage(0);
      setQuantity(1);
    });
    api.get(`/api/products/${slug}/related`).then((r) => setRelated(r.data));
  }, [slug]);

  const colors = useMemo(() => {
    if (!product) return [];
    const map = new Map();
    product.variants.forEach((v) => map.set(v.color.name, v.color));
    return Array.from(map.values());
  }, [product]);

  const sizesForColor = useMemo(() => {
    if (!product || !selectedColor) return [];
    return product.variants.filter((v) => v.color.name === selectedColor);
  }, [product, selectedColor]);

  const activeVariant = useMemo(() => {
    return sizesForColor.find((v) => v.size.name === selectedSize) || null;
  }, [sizesForColor, selectedSize]);

  if (!product) return <div className="container-shell py-24 text-center text-muted">Loading...</div>;

  const price = product.sale_price || product.price;
  const displayPrice = activeVariant?.price_override || price;

  const stockNote = (() => {
    if (!activeVariant) return null;
    if (activeVariant.stock_quantity === 0) return { text: "Out of stock", tone: "text-brick" };
    if (activeVariant.stock_quantity <= 5) return { text: `Only ${activeVariant.stock_quantity} left!`, tone: "text-mustard" };
    return { text: `${activeVariant.stock_quantity} in stock`, tone: "text-muted" };
  })();

  const canAdd = !!activeVariant && activeVariant.stock_quantity > 0;

  const handleAdd = (goToCheckout = false) => {
    if (!activeVariant || !canAdd) {
      toast.show("Select an available size first", "error");
      return;
    }
    addLine({
      variantId: activeVariant.id,
      productId: product.id,
      productName: product.name,
      slug: product.slug,
      size: activeVariant.size.name,
      color: activeVariant.color.name,
      material: product.material?.name ?? null,
      thumbnail: product.images[0]?.image_url ?? null,
      price: displayPrice,
      quantity,
      stockAvailable: activeVariant.stock_quantity,
    });
    toast.show(goToCheckout ? "Added — heading to checkout" : "Added to cart", "success");
    if (goToCheckout) navigate("/checkout"); else navigate("/cart");
  };

  return (
    <div className="container-shell py-10">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-[4/5] rounded-sm overflow-hidden bg-line mb-3">
            {product.images[activeImage] && (
              <img src={product.images[activeImage].image_url} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex gap-3">
            {product.images.map((img, i) => (
              <button key={img.id} onClick={() => setActiveImage(i)} className={"w-16 h-16 rounded-sm overflow-hidden border-2 " + (activeImage === i ? "border-brick" : "border-transparent")}>
                <img src={img.image_url} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-muted text-sm mb-1">{product.category?.name}</p>
          <h1 className="font-display text-4xl text-ink mb-3">{product.name}</h1>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-semibold text-ink">{money(displayPrice)}</span>
            {product.sale_price && <span className="text-muted line-through">{money(product.price)}</span>}
          </div>

          <p className="text-ink/80 leading-relaxed mb-6">{product.description}</p>

          <dl className="grid grid-cols-2 gap-3 text-sm mb-8 text-ink/80">
            <div><dt className="text-muted">Material</dt><dd>{product.material?.name}</dd></div>
            <div><dt className="text-muted">Brand</dt><dd>{product.brand}</dd></div>
            <div><dt className="text-muted">SKU</dt><dd>{activeVariant?.sku ?? product.sku}</dd></div>
          </dl>

          {/* Color */}
          <div className="mb-6">
            <div className="font-medium text-ink mb-2">Color: {selectedColor}</div>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedColor(c.name); setSelectedSize(null); }}
                  className={"w-9 h-9 rounded-full border-2 " + (selectedColor === c.name ? "border-brick" : "border-line")}
                  style={{ backgroundColor: c.hex_code }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-ink">Size</span>
              <button className="text-xs text-brick hover:underline">Size guide</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizesForColor.map((v) => (
                <button
                  key={v.id}
                  disabled={v.stock_quantity === 0}
                  onClick={() => setSelectedSize(v.size.name)}
                  className={
                    "px-4 py-2 rounded-sm border text-sm relative " +
                    (v.stock_quantity === 0
                      ? "border-line text-muted line-through cursor-not-allowed"
                      : selectedSize === v.size.name
                      ? "bg-ink text-paper border-ink"
                      : "border-line hover:border-ink")
                  }
                >
                  {v.size.name}
                </button>
              ))}
            </div>
          </div>
          {stockNote && <p className={"text-sm mb-6 " + stockNote.tone}>{stockNote.text}</p>}
          {!selectedSize && <p className="text-sm text-muted mb-6">Select a size to see availability.</p>}

          {/* Quantity + actions */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-line rounded-sm">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9">−</button>
              <span className="w-10 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => (activeVariant ? Math.min(q + 1, activeVariant.stock_quantity) : q))}
                className="w-9 h-9"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleAdd(false)}
              disabled={!canAdd}
              className="flex-1 border border-ink text-ink py-3 rounded-sm font-medium hover:bg-ink hover:text-paper transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add to Cart
            </button>
            <button
              onClick={() => handleAdd(true)}
              disabled={!canAdd}
              className="flex-1 bg-brick text-paper py-3 rounded-sm font-medium hover:bg-brick-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20 max-w-2xl">
        <h2 className="font-display text-2xl text-ink mb-6">Customer reviews</h2>
        {product.reviews.length === 0 ? (
          <p className="text-muted">No reviews yet for this product.</p>
        ) : (
          <div className="space-y-6">
            {product.reviews.map((r) => (
              <div key={r.id} className="border-b border-line pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-ink">{r.customer_name}</span>
                  <span className="text-mustard text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                </div>
                <p className="text-ink/80 text-sm">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display text-2xl text-ink mb-6">You might also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {related.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
