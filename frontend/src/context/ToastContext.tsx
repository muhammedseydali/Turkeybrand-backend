import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ToastMsg { id: number; text: string; kind: "success" | "error" | "info"; }
interface ToastCtx { show: (text: string, kind?: ToastMsg["kind"]) => void; }

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const show = useCallback((text: string, kind: ToastMsg["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, kind }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "px-4 py-3 rounded shadow-lg text-sm font-medium text-paper min-w-[220px] " +
              (t.kind === "success" ? "bg-ink" : t.kind === "error" ? "bg-brick" : "bg-ink/90")
            }
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
