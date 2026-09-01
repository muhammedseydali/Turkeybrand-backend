import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader, Badge } from "./ui";

interface Row {
  variant_id: number; product_name: string; sku: string; size: string; color: string;
  stock_quantity: number; sold_quantity: number; low_stock: boolean;
}

export default function Inventory() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/api/admin/inventory", { params: { low_stock_only: lowOnly } }).then((r) => setRows(r.data)).finally(() => setLoading(false));
  }, [lowOnly]);

  const filtered = rows.filter((r) =>
    !q || r.product_name.toLowerCase().includes(q.toLowerCase()) || r.sku.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Inventory" />
      <div className="px-8 pb-8">
        <div className="flex gap-3 mb-4">
          <input placeholder="Search product or SKU..." value={q} onChange={(e) => setQ(e.target.value)} className="border border-line rounded-sm px-3 py-2 text-sm w-64" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low / out of stock only
          </label>
        </div>
        {loading ? <div className="text-muted">Loading...</div> : (
          <div className="bg-panel border border-line rounded-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-muted">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Color</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Sold</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.variant_id} className="border-t border-line">
                    <td className="p-3 font-medium text-ink">{r.product_name}</td>
                    <td className="p-3 text-muted">{r.sku}</td>
                    <td className="p-3">{r.size}</td>
                    <td className="p-3">{r.color}</td>
                    <td className="p-3">{r.stock_quantity}</td>
                    <td className="p-3">{r.sold_quantity}</td>
                    <td className="p-3">
                      {r.stock_quantity === 0 ? <Badge text="out of stock" tone="bad" /> : r.low_stock ? <Badge text="low stock" tone="warn" /> : <Badge text="in stock" tone="good" />}
                    </td>
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
