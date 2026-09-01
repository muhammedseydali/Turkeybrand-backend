import { useEffect, useState } from "react";
import { api, Payment, money } from "../api";
import { PageHeader, Badge, statusTone } from "./ui";

const STATUSES = ["pending", "processing", "paid", "failed", "refunded", "cancelled"];

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/api/admin/payments", { params: filter ? { status: filter } : {} }).then((r) => setPayments(r.data)).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <PageHeader title="Payments" />
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
                  <th className="p-3">Payment ID</th>
                  <th className="p-3">Transaction ref</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="p-3 font-medium text-ink">#{p.id}</td>
                    <td className="p-3 text-muted">{p.transaction_id}</td>
                    <td className="p-3">{money(p.amount)}</td>
                    <td className="p-3 capitalize">{p.payment_method}</td>
                    <td className="p-3"><Badge text={p.status} tone={statusTone(p.status)} /></td>
                    <td className="p-3 text-muted text-xs">{new Date(p.created_at).toLocaleString()}</td>
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
