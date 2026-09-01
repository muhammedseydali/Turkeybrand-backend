import { useEffect, useState } from "react";
import { api, Order, money } from "../api";
import { PageHeader, Badge, statusTone } from "./ui";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/api/admin/orders", { params: filter ? { status: filter } : {} }).then((r) => setOrders(r.data)).finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const updateStatus = async (id: number, status: string) => {
    await api.put(`/api/admin/orders/${id}/status`, { status });
    load();
  };

  return (
    <div>
      <PageHeader title="Orders" />
      <div className="px-8 pb-8">
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setFilter("")} className={"px-3 py-1.5 rounded-sm text-sm border " + (filter === "" ? "bg-ink text-paper border-ink" : "border-line")}>All</button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={"px-3 py-1.5 rounded-sm text-sm border capitalize " + (filter === s ? "bg-ink text-paper border-ink" : "border-line")}>{s}</button>
          ))}
        </div>

        {loading ? <div className="text-muted">Loading...</div> : (
          <div className="bg-panel border border-line rounded-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-muted">
                <tr>
                  <th className="p-3">Order</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-line align-top">
                    <td className="p-3 font-medium text-ink">{o.order_number}</td>
                    <td className="p-3">{o.customer_name}<div className="text-muted text-xs">{o.email}</div></td>
                    <td className="p-3 text-xs text-muted max-w-[220px]">
                      {o.items.map((it) => `${it.product_name} (${it.size}/${it.color}) x${it.quantity}`).join(", ")}
                    </td>
                    <td className="p-3">{money(o.total)}</td>
                    <td className="p-3"><Badge text={o.payment?.status || "—"} tone={statusTone(o.payment?.status || "")} /></td>
                    <td className="p-3">
                      <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="border border-line rounded-sm px-2 py-1 text-xs capitalize">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-muted text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
