import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000" : "https://turkeybrand-backend.onrender.com");

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------- Types ----------
export interface Size { id: number; name: string; }
export interface Color { id: number; name: string; hex_code: string; }
export interface Category { id: number; name: string; slug: string; }
export interface CategoryWithCount extends Category { product_count: number; }
export interface Material { id: number; name: string; }

export interface Variant {
  id: number;
  size: Size;
  color: Color;
  sku: string;
  stock_quantity: number;
  sold_quantity: number;
  price_override: number | null;
}

export interface ProductCard {
  id: number;
  name: string;
  slug: string;
  brand: string;
  sku: string;
  product_type: string;
  price: number;
  sale_price: number | null;
  status: string;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  total_stock: number;
  thumbnail: string | null;
  category: string | null;
  material: string | null;
}

export interface ProductDetail extends Omit<ProductCard, "thumbnail" | "category" | "material"> {
  description: string;
  created_at: string;
  category: Category | null;
  material: Material | null;
  images: { id: number; image_url: string; sort_order: number }[];
  variants: Variant[];
  reviews: { id: number; customer_name: string; rating: number; comment: string; created_at: string }[];
}

export interface OrderItem {
  id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}
export interface Payment {
  id: number;
  payment_gateway: string;
  transaction_id: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}
export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  email: string;
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  payment: Payment | null;
}

export function money(n: number) {
  return "\u20B9" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}
