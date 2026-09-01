import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { api, money } from "../api";
import { PageHeader, StatCard } from "./ui";

interface Overview {
  total_sales: number; today_sales: number; monthly_sales: number;
  total_orders: number; pending_orders: number; completed_orders: number;
  total_products: number; low_stock_products: number; out_of_stock_products: number; total_customers: number;
}

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    api.get("/api/admin/dashboard").then((r) => setOverview(r.data));
    api.get("/api/admin/reports/sales", { params: { range: "this_month" } }).then((r) => setReport(r.data));
  }, []);

  if (!overview) return <div className="p-8 text-muted">Loading dashboard...</div>;

  return (
    <div>
      <PageHeader title="Dashboard" />
      <div className="px-8 pb-8">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard label="Total sales" value={money(overview.total_sales)} />
          <StatCard label="Today's sales" value={money(overview.today_sales)} />
          <StatCard label="Monthly sales" value={money(overview.monthly_sales)} />
          <StatCard label="Total orders" value={overview.total_orders} />
          <StatCard label="Total customers" value={overview.total_customers} />
          <StatCard label="Pending orders" value={overview.pending_orders} tone="mustard" />
          <StatCard label="Completed orders" value={overview.completed_orders} />
          <StatCard label="Total products" value={overview.total_products} />
          <StatCard label="Low-stock products" value={overview.low_stock_products} tone="mustard" />
          <StatCard label="Out-of-stock products" value={overview.out_of_stock_products} tone="brick" />
        </div>

        {report && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-panel border border-line rounded-sm p-5">
              <div className="font-medium text-ink mb-4">Revenue this month</div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={report.sales_by_day}>
                  <CartesianGrid stroke="#E4DFD3" strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => money(Number(v))} />
                  <Line type="monotone" dataKey="revenue" stroke="#AC3728" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-panel border border-line rounded-sm p-5">
              <div className="font-medium text-ink mb-4">Best-selling products (this month)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={report.best_selling_products} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke="#E4DFD3" strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="units" fill="#D9A63E" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
