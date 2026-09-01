import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api, money } from "../api";
import { PageHeader, StatCard } from "./ui";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
];

export default function Reports() {
  const [range, setRange] = useState("this_month");
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    api.get("/api/admin/reports/sales", { params: { range } }).then((r) => setReport(r.data));
  }, [range]);

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ["Metric", "Value"],
      ["Total revenue", report.total_revenue],
      ["Orders", report.num_orders],
      ["Average order value", report.avg_order_value],
      ["Units sold", report.units_sold],
      [],
      ["Best-selling product", "Units"],
      ...report.best_selling_products.map((p: any) => [p.name, p.units]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `sales-report-${range}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Sales Reports"
        action={<button onClick={exportCsv} className="border border-ink text-ink px-4 py-2 rounded-sm text-sm hover:bg-ink hover:text-paper">Export CSV</button>}
      />
      <div className="px-8 pb-8">
        <div className="flex gap-2 mb-6 flex-wrap">
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setRange(r.value)} className={"px-3 py-1.5 rounded-sm text-sm border " + (range === r.value ? "bg-ink text-paper border-ink" : "border-line")}>
              {r.label}
            </button>
          ))}
        </div>

        {report && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total revenue" value={money(report.total_revenue)} />
              <StatCard label="Orders" value={report.num_orders} />
              <StatCard label="Avg order value" value={money(report.avg_order_value)} />
              <StatCard label="Units sold" value={report.units_sold} />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-panel border border-line rounded-sm p-5">
                <div className="font-medium text-ink mb-4">Revenue by day</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={report.sales_by_day}>
                    <CartesianGrid stroke="#E4DFD3" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => money(Number(v))} />
                    <Bar dataKey="revenue" fill="#AC3728" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-panel border border-line rounded-sm p-5">
                <div className="font-medium text-ink mb-4">Units sold by size</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={report.sales_by_size}>
                    <CartesianGrid stroke="#E4DFD3" strokeDasharray="3 3" />
                    <XAxis dataKey="size" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="units" fill="#D9A63E" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-panel border border-line rounded-sm p-5 mt-6">
              <div className="font-medium text-ink mb-4">Best-selling products</div>
              <table className="w-full text-sm">
                <thead className="text-left text-muted">
                  <tr><th className="p-2">Product</th><th className="p-2">Units sold</th></tr>
                </thead>
                <tbody>
                  {report.best_selling_products.map((p: any) => (
                    <tr key={p.name} className="border-t border-line">
                      <td className="p-2">{p.name}</td><td className="p-2">{p.units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
