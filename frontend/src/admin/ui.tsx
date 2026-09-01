import { ReactNode } from "react";

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-8 pt-8 pb-6">
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      {action}
    </div>
  );
}

export function StatCard({ label, value, tone }: { label: string; value: string | number; tone?: "brick" | "mustard" }) {
  return (
    <div className="bg-panel border border-line rounded-sm p-5">
      <div className="text-sm text-muted mb-1">{label}</div>
      <div className={"text-2xl font-display " + (tone === "brick" ? "text-brick" : tone === "mustard" ? "text-mustard" : "text-ink")}>
        {value}
      </div>
    </div>
  );
}

export function Badge({ text, tone = "default" }: { text: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const colors: Record<string, string> = {
    default: "bg-line text-ink",
    good: "bg-mustard/30 text-ink",
    warn: "bg-mustard/50 text-ink",
    bad: "bg-brick/15 text-brick",
  };
  return <span className={"px-2 py-0.5 rounded-sm text-xs font-medium capitalize " + colors[tone]}>{text}</span>;
}

export function statusTone(status: string): "default" | "good" | "warn" | "bad" {
  if (["delivered", "paid", "confirmed"].includes(status)) return "good";
  if (["pending", "processing", "shipped"].includes(status)) return "warn";
  if (["cancelled", "failed", "returned", "refunded"].includes(status)) return "bad";
  return "default";
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={"bg-panel rounded-sm w-full max-h-[90vh] overflow-y-auto p-6 " + (wide ? "max-w-2xl" : "max-w-md")}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
