import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface CartLine {
  variantId: number;
  productId: number;
  productName: string;
  slug: string;
  size: string;
  color: string;
  material: string | null;
  thumbnail: string | null;
  price: number;
  quantity: number;
  stockAvailable: number;
}

interface CartCtx {
  lines: CartLine[];
  addLine: (line: CartLine) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeLine: (variantId: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
}

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "sf_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const addLine = useCallback((line: CartLine) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === line.variantId);
      if (existing) {
        const qty = Math.min(existing.quantity + line.quantity, line.stockAvailable);
        return prev.map((l) => (l.variantId === line.variantId ? { ...l, quantity: qty } : l));
      }
      return [...prev, line];
    });
  }, []);

  const updateQuantity = useCallback((variantId: number, quantity: number) => {
    setLines((prev) =>
      prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(1, Math.min(quantity, l.stockAvailable)) } : l))
    );
  }, []);

  const removeLine = useCallback((variantId: number) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const count = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <Ctx.Provider value={{ lines, addLine, updateQuantity, removeLine, clear, subtotal, count }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
