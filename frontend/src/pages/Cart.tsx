import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { money } from "../api";

export default function Cart() {
  const { lines, updateQuantity, removeLine, subtotal } = useCart();
  const navigate = useNavigate();

  if (lines.length === 0) {
    return (
      <div className="container-shell py-24 text-center">
        <p className="font-display text-3xl text-ink mb-3">Your cart is empty</p>
        <p className="text-muted mb-6">Nothing here yet — go find something worth wearing.</p>
        <Link to="/shop" className="bg-ink text-paper px-6 py-3 rounded-sm font-medium hover:bg-ink/90">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-shell py-10">
      <h1 className="font-display text-4xl text-ink mb-8">Your Cart</h1>
      <div className="grid md:grid-cols-[1fr_320px] gap-10">
        <div className="divide-y divide-line border-t border-b border-line">
          {lines.map((l) => (
            <div key={l.variantId} className="py-5 flex gap-4">
              <div className="w-24 h-28 rounded-sm overflow-hidden bg-line shrink-0">
                {l.thumbnail && <img src={l.thumbnail} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1">
                <Link to={`/product/${l.slug}`} className="font-medium text-ink hover:text-brick">{l.productName}</Link>
                <p className="text-sm text-muted mt-1">Size {l.size} · {l.color} {l.material ? `· ${l.material}` : ""}</p>
                <p className="text-sm text-muted">{l.stockAvailable} available</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center border border-line rounded-sm">
                    <button onClick={() => updateQuantity(l.variantId, l.quantity - 1)} className="w-8 h-8">−</button>
                    <span className="w-8 text-center text-sm">{l.quantity}</span>
                    <button onClick={() => updateQuantity(l.variantId, l.quantity + 1)} className="w-8 h-8">+</button>
                  </div>
                  <button onClick={() => removeLine(l.variantId)} className="text-sm text-brick hover:underline">Remove</button>
                </div>
              </div>
              <div className="font-medium text-ink">{money(l.price * l.quantity)}</div>
            </div>
          ))}
        </div>

        <div className="border border-line rounded-sm p-6 h-fit">
          <h2 className="font-medium text-ink mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm mb-2"><span className="text-muted">Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between text-sm mb-4"><span className="text-muted">Shipping</span><span>{subtotal >= 1999 ? "Free" : money(49)}</span></div>
          <div className="flex justify-between font-medium text-lg border-t border-line pt-4 mb-6">
            <span>Total</span><span>{money(subtotal >= 1999 ? subtotal : subtotal + 49)}</span>
          </div>
          <button onClick={() => navigate("/checkout")} className="w-full bg-brick text-paper py-3 rounded-sm font-medium hover:bg-brick-dark transition-colors">
            Proceed to Checkout
          </button>
          <Link to="/shop" className="block text-center text-sm text-muted mt-4 hover:text-ink">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
