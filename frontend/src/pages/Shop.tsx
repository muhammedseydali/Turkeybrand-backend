import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ProductCard as ProductCardT, Category, Material, Size, Color } from "../api";
import ProductCard from "../components/ProductCard";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<ProductCardT[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);

  useEffect(() => {
    api.get("/api/categories").then((r) => setCategories(r.data));
    api.get("/api/materials").then((r) => setMaterials(r.data));
    api.get("/api/sizes").then((r) => setSizes(r.data));
    api.get("/api/colors").then((r) => setColors(r.data));
  }, []);

  const page = Number(params.get("page") || 1);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const query: Record<string, string> = {};
    params.forEach((v, k) => { query[k] = v; });
    api.get("/api/products", { params: query }).then((r) => {
      setItems(r.data.items);
      setTotal(r.data.total);
      setTotalPages(r.data.total_pages);
      setLoading(false);
    });
  }, [params]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "") next.delete(key); else next.set(key, value);
    next.delete("page");
    setParams(next);
  };

  const activeType = params.get("product_type") || "";
  const activeSize = params.get("size") || "";
  const activeColor = params.get("color") || "";
  const activeMaterial = params.get("material") || "";
  const activeAvailability = params.get("availability") || "";
  const activeSort = params.get("sort") || "";

  return (
    <div className="container-shell py-10">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">Shop</h1>
          {params.get("q") && <p className="text-muted mt-1">Results for "{params.get("q")}"</p>}
        </div>
        <select
          value={activeSort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="border border-line rounded-sm px-3 py-2 text-sm bg-panel"
        >
          <option value="">Sort: Featured</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Popular</option>
          <option value="best_selling">Best selling</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-10">
        {/* Filters */}
        <aside className="space-y-8">
          <div>
            <div className="font-medium text-ink mb-2">Category</div>
            <div className="flex flex-col gap-1 text-sm">
              {["shirt", "tshirt"].map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={activeType === t} onChange={() => setParam("product_type", t)} />
                  {t === "shirt" ? "Shirts" : "T-Shirts"}
                </label>
              ))}
              {activeType && (
                <button onClick={() => setParam("product_type", null)} className="text-brick text-xs mt-1 text-left">Clear</button>
              )}
            </div>
          </div>

          <div>
            <div className="font-medium text-ink mb-2">Size</div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setParam("size", activeSize === s.name ? null : s.name)}
                  className={
                    "w-9 h-9 text-xs rounded-sm border " +
                    (activeSize === s.name ? "bg-ink text-paper border-ink" : "border-line hover:border-ink")
                  }
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="font-medium text-ink mb-2">Color</div>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  title={c.name}
                  onClick={() => setParam("color", activeColor === c.name ? null : c.name)}
                  className={"w-7 h-7 rounded-full border-2 " + (activeColor === c.name ? "border-brick" : "border-line")}
                  style={{ backgroundColor: c.hex_code }}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="font-medium text-ink mb-2">Material</div>
            <select
              value={activeMaterial}
              onChange={(e) => setParam("material", e.target.value || null)}
              className="w-full border border-line rounded-sm px-2 py-1.5 text-sm bg-panel"
            >
              <option value="">All materials</option>
              {materials.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <div className="font-medium text-ink mb-2">Availability</div>
            <div className="flex flex-col gap-1 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={activeAvailability === "in_stock"} onChange={() => setParam("availability", "in_stock")} />
                In stock
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={activeAvailability === "out_of_stock"} onChange={() => setParam("availability", "out_of_stock")} />
                Out of stock
              </label>
              {activeAvailability && (
                <button onClick={() => setParam("availability", null)} className="text-brick text-xs mt-1 text-left">Clear</button>
              )}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-line rounded-sm" />
                  <div className="h-4 bg-line rounded mt-3 w-2/3" />
                  <div className="h-4 bg-line rounded mt-2 w-1/3" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-2xl text-ink mb-2">Nothing matches those filters</p>
              <p className="text-muted mb-6">Try widening your search or clearing a filter.</p>
              <button onClick={() => setParams({})} className="text-brick font-medium hover:underline">Clear all filters</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted mb-4">{total} product{total !== 1 ? "s" : ""}</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {items.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setParams((prev) => { const n = new URLSearchParams(prev); n.set("page", String(i + 1)); return n; })}
                      className={"w-9 h-9 rounded-sm text-sm " + (page === i + 1 ? "bg-ink text-paper" : "border border-line hover:border-ink")}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
