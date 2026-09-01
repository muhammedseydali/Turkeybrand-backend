import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { count } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : "/shop");
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b border-line">
      <div className="container-shell flex items-center justify-between h-[68px] gap-6">
        <Link to="/" className="font-display text-2xl tracking-tight text-ink shrink-0">
          Turkey<span className="text-brick">brand</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-ink/80 font-medium">
          <Link to="/shop" className="hover:text-brick transition-colors">Shop</Link>
          <Link to="/shop?product_type=shirt" className="hover:text-brick transition-colors">Shirts</Link>
          <Link to="/shop?product_type=tshirt" className="hover:text-brick transition-colors">T-Shirts</Link>
          <Link to="/shop?new_arrivals=true" className="hover:text-brick transition-colors">New Arrivals</Link>
          <Link to="/shop?best_sellers=true" className="hover:text-brick transition-colors">Best Sellers</Link>
        </nav>

        <form onSubmit={submitSearch} className="hidden lg:flex flex-1 max-w-xs">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search shirts, SKU, fabric..."
            className="w-full border border-line rounded-sm px-3 py-1.5 text-sm bg-panel focus:outline-none focus:border-brick"
          />
        </form>

        <div className="flex items-center gap-4 text-sm shrink-0">
          {user ? (
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="font-medium hover:text-brick">
                Hi, {user.name.split(" ")[0]}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-panel border border-line rounded shadow-lg py-1 text-ink">
                  <Link to="/account/orders" onClick={() => setMenuOpen(false)} className="block px-4 py-2 hover:bg-paper">My Orders</Link>
                  <button
                    onClick={() => { logout(); setMenuOpen(false); navigate("/"); }}
                    className="w-full text-left px-4 py-2 hover:bg-paper"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="font-medium hover:text-brick">Account</Link>
          )}

          <Link to="/cart" className="relative font-medium hover:text-brick">
            Cart
            {count > 0 && (
              <span className="absolute -top-2 -right-3 bg-brick text-paper text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
