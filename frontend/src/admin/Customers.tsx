import { useEffect, useState } from "react";
import { api, Order, money } from "../api";
import { PageHeader, Badge, statusTone, Modal } from "./ui";

interface Customer {
  id: number; name: string; email: string; phone: string | null;
  orders_count: number; total_spent: number; last_order: string | null; is_active: boolean; created_at: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.get("/api/admin/customers").then((r) => setCustomers(r.data)).finally(() => setLoading(false));
  }, []);

  const openCustomer = (id: number) => {
    setOpenId(id);
    api.get(`/api/admin/customers/${id}/orders`).then((r) => setOrders(r.data));
  };

  const activeCustomer = customers.find((c) => c.id === openId);

  return (
    <div>
      <PageHeader title="Customers" />
      <div className="px-8 pb-8">
        {loading ? <div className="text-muted">Loading...</div> : (
          <div className="bg-panel border border-line rounded-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-muted">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">Total spent</th>
                  <th className="p-3">Last order</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="p-3 font-medium text-ink">{c.name}</td>
                    <td className="p-3 text-muted">{c.email}</td>
                    <td className="p-3">{c.orders_count}</td>
                    <td className="p-3">{money(c.total_spent)}</td>
                    <td className="p-3 text-muted text-xs">{c.last_order ? new Date(c.last_order).toLocaleDateString() : "—"}</td>
                    <td className="p-3 text-muted text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="p-3"><button onClick={() => openCustomer(c.id)} className="text-brick hover:underline">View orders</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={openId !== null} onClose={() => setOpenId(null)} title={activeCustomer ? `${activeCustomer.name}'s orders` : "Orders"} wide>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {orders.length === 0 && <p className="text-muted text-sm">No orders yet.</p>}
          {orders.map((o) => (
            <div key={o.id} className="border border-line rounded-sm p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-ink">{o.order_number}</span>
                <Badge text={o.status} tone={statusTone(o.status)} />
              </div>
              <div className="text-muted text-xs mb-1">{new Date(o.created_at).toLocaleString()}</div>
              <div className="text-xs text-ink/80">{o.items.map((it) => `${it.product_name} x${it.quantity}`).join(", ")}</div>
              <div className="text-right font-medium mt-1">{money(o.total)}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
