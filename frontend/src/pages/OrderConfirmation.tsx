import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, Order, money } from "../api";

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (orderNumber) api.get(`/api/orders/${orderNumber}`).then((r) => setOrder(r.data));
  }, [orderNumber]);

  if (!order) return <div className="container-shell py-24 text-center text-muted">Loading order...</div>;

  return (
    <div className="container-shell py-16 max-w-xl mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-mustard/30 flex items-center justify-center mx-auto mb-6 text-2xl">✓</div>
      <h1 className="font-display text-3xl text-ink mb-2">Order confirmed</h1>
      <p className="text-muted mb-8">
        Thanks, {order.customer_name.split(" ")[0]}. A confirmation has been sent to {order.email}.
      </p>

      <div className="border border-line rounded-sm p-6 text-left">
        <div className="flex justify-between mb-4">
          <div>
            <div className="text-sm text-muted">Order number</div>
            <div className="font-medium text-ink">{order.order_number}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted">Status</div>
            <div className="font-medium text-ink capitalize">{order.status}</div>
          </div>
        </div>
        <div className="divide-y divide-line border-t border-line">
          {order.items.map((it) => (
            <div key={it.id} className="py-3 flex justify-between text-sm">
              <span>{it.product_name} × {it.quantity} <span className="text-muted">({it.size}/{it.color})</span></span>
              <span>{money(it.price * it.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-medium text-lg border-t border-line pt-4 mt-2">
          <span>Total paid</span><span>{money(order.total)}</span>
        </div>
      </div>

      <div className="flex gap-4 justify-center mt-8">
        <Link to="/shop" className="border border-ink text-ink px-5 py-2.5 rounded-sm font-medium hover:bg-ink hover:text-paper transition-colors">Continue shopping</Link>
        <Link to="/account/orders" className="bg-ink text-paper px-5 py-2.5 rounded-sm font-medium hover:bg-ink/90 transition-colors">Track my orders</Link>
      </div>
    </div>
  );
}
