export default function Footer() {
  return (
    <footer className="bg-ink text-paper/80 mt-20">
      <div className="container-shell py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="font-display text-2xl text-paper mb-3">Turkey<span className="text-brick">brand</span></div>
          <p className="text-sm leading-relaxed max-w-xs text-paper/70">
            Turkeybrand has built shirts and denim for how Kerala actually lives since 2011 — breathable fabric, precise stitching, and a fit that holds up wash after wash.
          </p>
        </div>
        <div>
          <div className="text-paper font-medium mb-3 text-sm">Shop</div>
          <ul className="text-sm space-y-2">
            <li><a href="/shop?product_type=shirt" className="hover:text-mustard">Shirts</a></li>
            <li><a href="/shop?product_type=tshirt" className="hover:text-mustard">T-Shirts</a></li>
            <li><a href="/shop?new_arrivals=true" className="hover:text-mustard">New Arrivals</a></li>
            <li><a href="/shop?best_sellers=true" className="hover:text-mustard">Best Sellers</a></li>
          </ul>
        </div>
        <div>
          <div className="text-paper font-medium mb-3 text-sm">Company</div>
          <ul className="text-sm space-y-2">
            <li>Sizing Guide</li>
            <li>Shipping &amp; Returns</li>
            <li>Track an Order</li>
            <li>Kamaleswaram Store</li>
          </ul>
        </div>
        <div>
          <div className="text-paper font-medium mb-3 text-sm">Reach Us</div>
          <ul className="text-sm space-y-2">
            <li>support@turkeybrand.com</li>
            <li>Flagship Store: Kamaleswaram, Kerala</li>
            <li>Shipping to 4 cities in Kerala &amp; Tamil Nadu</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-paper/50">
        © {new Date().getFullYear()} Turkeybrand. Built for Kerala since 2011.
      </div>
    </footer>
  );
}
