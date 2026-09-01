import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api, money } from "../api";

export default function Checkout() {
  const { lines, subtotal, clear } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customer_name: "", email: "", phone: "", address: "", city: "", state: "", country: "India", postal_code: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [submitting, setSubmitting] = useState(false);

  if (lines.length === 0) {
    return (
      <div className="container-shell py-24 text-center">
        <p className="font-display text-3xl text-ink mb-3">Nothing to check out</p>
        <Link to="/shop" className="text-brick font-medium hover:underline">Back to shop</Link>
      </div>
    );
  }

  const shipping = subtotal >= 1999 ? 0 : 49;
  const total = subtotal + shipping;

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: order } = await api.post("/api/orders", {
        ...form,
        payment_method: paymentMethod,
        shipping,
        items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
      });
      await api.post(`/api/payments/${order.order_number}/pay`);
      clear();
      toast.show("Order placed and payment confirmed", "success");
      navigate(`/order-confirmation/${order.order_number}`);
    } catch (err: any) {
      toast.show(err?.response?.data?.detail || "Checkout failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-shell py-10">
      <h1 className="font-display text-4xl text-ink mb-8">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-[1fr_340px] gap-10">
        <div className="space-y-8">
          <fieldset>
            <legend className="font-medium text-ink mb-3">Customer information</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <input required placeholder="Full name" defaultValue={user?.name} onChange={(e) => update("customer_name", e.target.value)} className="border border-line rounded-sm px-3 py-2 sm:col-span-2" />
              <input required type="email" placeholder="Email" onChange={(e) => update("email", e.target.value)} className="border border-line rounded-sm px-3 py-2" />
              <input required placeholder="Phone number" onChange={(e) => update("phone", e.target.value)} className="border border-line rounded-sm px-3 py-2" />
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-medium text-ink mb-3">Delivery information</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <input required placeholder="Address" onChange={(e) => update("address", e.target.value)} className="border border-line rounded-sm px-3 py-2 sm:col-span-2" />
              <input required placeholder="City" onChange={(e) => update("city", e.target.value)} className="border border-line rounded-sm px-3 py-2" />
              <input required placeholder="State" onChange={(e) => update("state", e.target.value)} className="border border-line rounded-sm px-3 py-2" />
              <input required placeholder="Country" defaultValue="India" onChange={(e) => update("country", e.target.value)} className="border border-line rounded-sm px-3 py-2" />
              <input required placeholder="Postal code" onChange={(e) => update("postal_code", e.target.value)} className="border border-line rounded-sm px-3 py-2" />
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-medium text-ink mb-3">Payment method</legend>
            <div className="flex gap-3">
              {["card", "upi", "netbanking"].map((m) => (
                <button
                  type="button" key={m} onClick={() => setPaymentMethod(m)}
                  className={"px-4 py-2 rounded-sm border text-sm capitalize " + (paymentMethod === m ? "bg-ink text-paper border-ink" : "border-line")}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-2">
              Demo checkout — this simulates a successful payment. Wire in Razorpay/Stripe here for a live gateway.
            </p>
          </fieldset>
        </div>

        <div className="border border-line rounded-sm p-6 h-fit">
          <h2 className="font-medium text-ink mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4 max-h-56 overflow-y-auto">
            {lines.map((l) => (
              <div key={l.variantId} className="flex justify-between text-sm">
                <span className="text-ink/80">{l.productName} × {l.quantity} <span className="text-muted">({l.size}/{l.color})</span></span>
                <span>{money(l.price * l.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm mb-2 border-t border-line pt-3"><span className="text-muted">Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between text-sm mb-4"><span className="text-muted">Shipping</span><span>{shipping === 0 ? "Free" : money(shipping)}</span></div>
          <div className="flex justify-between font-medium text-lg border-t border-line pt-4 mb-6"><span>Total</span><span>{money(total)}</span></div>
          <button disabled={submitting} type="submit" className="w-full bg-brick text-paper py-3 rounded-sm font-medium hover:bg-brick-dark transition-colors disabled:opacity-60">
            {submitting ? "Placing order..." : `Pay ${money(total)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
