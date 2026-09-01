import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ProductCard as ProductCardT } from "../api";
import ProductCard from "../components/ProductCard";

function Row({ title, viewAllHref, products }: { title: string; viewAllHref: string; products: ProductCardT[] }) {
  if (!products.length) return null;
  return (
    <section className="container-shell py-14">
      <div className="flex items-end justify-between mb-6">
        <h2 className="font-display text-3xl text-ink">{title}</h2>
        <Link to={viewAllHref} className="text-sm font-medium text-brick hover:underline">View all</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        {products.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

export default function Home() {
  const [shirts, setShirts] = useState<ProductCardT[]>([]);
  const [tshirts, setTshirts] = useState<ProductCardT[]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductCardT[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductCardT[]>([]);

  useEffect(() => {
    api.get("/api/products", { params: { product_type: "shirt", page_size: 4 } }).then((r) => setShirts(r.data.items));
    api.get("/api/products", { params: { product_type: "tshirt", page_size: 4 } }).then((r) => setTshirts(r.data.items));
    api.get("/api/products", { params: { new_arrivals: true, page_size: 4 } }).then((r) => setNewArrivals(r.data.items));
    api.get("/api/products", { params: { best_sellers: true, page_size: 4 } }).then((r) => setBestSellers(r.data.items));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-ink text-paper overflow-hidden">
        <div className="container-shell grid md:grid-cols-2 gap-10 items-center py-20 md:py-28">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-mustard text-xs font-semibold rounded-full uppercase tracking-wider mb-5">
              <span>Since 2011</span>
              <span>•</span>
              <span>Kerala &amp; Tamil Nadu</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.05] mb-6">
              Shirts &amp; denim built for how Kerala actually lives.
            </h1>
            <p className="text-paper/70 max-w-md mb-8 leading-relaxed">
              Breathable fabric, precise stitching, and a fit that holds up wash after wash. Now shipping across 4 cities in Kerala and Tamil Nadu, with our flagship store in Kamaleswaram.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop" className="bg-brick hover:bg-brick-dark transition-colors px-6 py-3 rounded-sm font-medium">
                Shop the collection
              </Link>
              <Link to="/shop?new_arrivals=true" className="border border-paper/30 hover:border-paper transition-colors px-6 py-3 rounded-sm font-medium">
                New arrivals
              </Link>
            </div>
          </div>
          <div className="aspect-[4/5] rounded-sm overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=1000&auto=format&fit=crop"
              alt="Model wearing a Turkeybrand shirt"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Brand Heritage Bar */}
      <section className="bg-paper border-b border-line py-8">
        <div className="container-shell grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-brick/10 text-brick flex items-center justify-center font-display font-bold text-lg shrink-0">11</div>
            <div>
              <div className="font-medium text-ink text-sm">Since 2011</div>
              <div className="text-xs text-muted mt-0.5">Over a decade perfecting fits &amp; enduring stitch craft.</div>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-brick/10 text-brick flex items-center justify-center font-display font-bold text-lg shrink-0">KL</div>
            <div>
              <div className="font-medium text-ink text-sm">Kamaleswaram Store</div>
              <div className="text-xs text-muted mt-0.5">Visit our flagship retail space in Kamaleswaram.</div>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-brick/10 text-brick flex items-center justify-center font-display font-bold text-lg shrink-0">4C</div>
            <div>
              <div className="font-medium text-ink text-sm">4 Cities Shipping</div>
              <div className="text-xs text-muted mt-0.5">Fast direct delivery across Kerala &amp; Tamil Nadu.</div>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-brick/10 text-brick flex items-center justify-center font-display font-bold text-lg shrink-0">100</div>
            <div>
              <div className="font-medium text-ink text-sm">Breathable &amp; Durable</div>
              <div className="text-xs text-muted mt-0.5">Engineered to hold shape wash after wash.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-shell py-14 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link to="/shop?product_type=shirt" className="group relative aspect-[16/9] rounded-sm overflow-hidden">
          <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-ink/30 flex items-end p-6">
            <span className="font-display text-2xl text-paper">Shirts</span>
          </div>
        </Link>
        <Link to="/shop?product_type=tshirt" className="group relative aspect-[16/9] rounded-sm overflow-hidden">
          <img src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-ink/30 flex items-end p-6">
            <span className="font-display text-2xl text-paper">T-Shirts</span>
          </div>
        </Link>
      </section>

      <Row title="Featured shirts" viewAllHref="/shop?product_type=shirt" products={shirts} />
      <Row title="Featured t-shirts" viewAllHref="/shop?product_type=tshirt" products={tshirts} />

      {/* Promo banner */}
      <section className="bg-mustard/20 border-y border-mustard/40">
        <div className="container-shell py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <div className="font-display text-2xl text-ink">Free shipping over ₹1,999</div>
            <div className="text-ink/70 text-sm">Applied automatically at checkout, no code needed.</div>
          </div>
          <Link to="/shop" className="bg-ink text-paper px-5 py-2.5 rounded-sm font-medium hover:bg-ink/90 transition-colors">
            Start shopping
          </Link>
        </div>
      </section>

      <Row title="New arrivals" viewAllHref="/shop?new_arrivals=true" products={newArrivals} />
      <Row title="Best sellers" viewAllHref="/shop?best_sellers=true" products={bestSellers} />
    </div>
  );
}
