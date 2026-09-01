import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Order, money } from "../api";

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function MyOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/orders").then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container-shell py-24 text-center text-muted">Loading orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="container-shell py-24 text-center">
        <p className="font-display text-3xl text-ink mb-3">No orders yet</p>
        <Link to="/shop" className="text-brick font-medium hover:underline">Start shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-shell py-10 max-w-3xl">
      <h1 className="font-display text-4xl text-ink mb-8">My Orders</h1>
      <div className="space-y-6">
        {orders.map((o) => {
          const stepIndex = STATUS_STEPS.indexOf(o.status);
          const cancelled = o.status === "cancelled" || o.status === "returned";
          return (
            <div key={o.id} className="border border-line rounded-sm p-6">
              <div className="flex flex-wrap justify-between gap-2 mb-4">
                <div>
                  <div className="font-medium text-ink">{o.order_number}</div>
                  <div className="text-sm text-muted">{new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-ink">{money(o.total)}</div>
                  <div className="text-sm text-muted capitalize">{o.payment?.status} payment</div>
                </div>
              </div>

              {!cancelled ? (
                <div className="flex items-center mb-4">
                  {STATUS_STEPS.map((s, i) => (
                    <div key={s} className="flex-1 flex items-center">
                      <div className={"w-2.5 h-2.5 rounded-full " + (i <= stepIndex ? "bg-brick" : "bg-line")} />
                      {i < STATUS_STEPS.length - 1 && <div className={"flex-1 h-0.5 " + (i < stepIndex ? "bg-brick" : "bg-line")} />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-brick text-sm mb-4 capitalize">{o.status}</p>
              )}

              <div className="divide-y divide-line border-t border-line text-sm">
                {o.items.map((it) => (
                  <div key={it.id} className="py-2 flex justify-between">
                    <span>{it.product_name} × {it.quantity} <span className="text-muted">({it.size}/{it.color})</span></span>
                    <span>{money(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
