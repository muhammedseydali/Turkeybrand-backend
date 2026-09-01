import { Link } from "react-router-dom";
import { ProductCard as ProductCardT, money } from "../api";

export default function ProductCard({ p }: { p: ProductCardT }) {
  const outOfStock = p.total_stock === 0;
  return (
    <Link to={`/product/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-line rounded-sm">
        {p.thumbnail && (
          <img
            src={p.thumbnail}
            alt={p.name}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {p.is_new_arrival && <span className="bg-ink text-paper text-[11px] px-2 py-0.5 rounded-sm">New</span>}
          {p.sale_price && <span className="bg-brick text-paper text-[11px] px-2 py-0.5 rounded-sm">Sale</span>}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 bg-paper/70 flex items-center justify-center">
            <span className="text-ink font-medium text-sm border border-ink px-3 py-1 rounded-sm bg-paper">Out of stock</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-sm text-muted">{p.category}</div>
        <div className="font-medium text-ink group-hover:text-brick transition-colors">{p.name}</div>
        <div className="mt-1 flex items-center gap-2">
          {p.sale_price ? (
            <>
              <span className="font-semibold text-ink">{money(p.sale_price)}</span>
              <span className="text-sm text-muted line-through">{money(p.price)}</span>
            </>
          ) : (
            <span className="font-semibold text-ink">{money(p.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
