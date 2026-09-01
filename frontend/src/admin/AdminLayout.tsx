import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/inventory", label: "Inventory" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/payments", label: "Payments" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/reports", label: "Reports" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "admin") return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-60 bg-ink text-paper flex flex-col shrink-0">
        <div className="px-6 py-6 font-display text-xl border-b border-white/10">
          Turkey<span className="text-mustard">brand</span>
          <div className="text-xs text-paper/50 font-body mt-0.5">Admin</div>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                "block px-6 py-2.5 text-sm font-medium " +
                (isActive ? "bg-white/10 text-paper border-l-2 border-brick" : "text-paper/70 hover:text-paper hover:bg-white/5")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-6 border-t border-white/10">
          <div className="text-sm text-paper/70 mb-2">{user.name}</div>
          <button
            onClick={() => { logout(); navigate("/admin/login"); }}
            className="text-sm text-paper/60 hover:text-paper"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
