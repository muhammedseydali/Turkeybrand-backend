import { useState } from "react";
import { api, CategoryWithCount } from "../api";
import { useToast } from "../context/ToastContext";
import { Modal, Badge } from "./ui";

export default function CategoryManager({
  open, onClose, categories, onChanged,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryWithCount[];
  onChanged: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await api.post("/api/admin/categories", { name: trimmed });
      toast.show("Category added", "success");
      setName("");
      onChanged();
    } catch (err: any) {
      toast.show(err?.response?.data?.detail || "Couldn't add category", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category? Products using it need to be reassigned or archived first.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/admin/categories/${id}`);
      toast.show("Category deleted", "success");
      onChanged();
    } catch (err: any) {
      toast.show(err?.response?.data?.detail || "Couldn't delete category", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Manage Categories">
      <form onSubmit={addCategory} className="flex gap-2 mb-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Polo T-Shirts"
          className="flex-1 border border-line rounded-sm px-3 py-2 text-sm"
        />
        <button
          disabled={saving || !name.trim()}
          className="bg-brick text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-brick-dark disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add"}
        </button>
      </form>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {categories.length === 0 && <p className="text-muted text-sm">No categories yet.</p>}
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between border border-line rounded-sm px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink">{c.name}</span>
              <Badge text={`${c.product_count} product${c.product_count === 1 ? "" : "s"}`} />
            </div>
            <button
              onClick={() => deleteCategory(c.id)}
              disabled={deletingId === c.id}
              title={c.product_count > 0 ? "Only categories with no active products can be deleted" : "Delete category"}
              className="text-muted hover:text-brick disabled:opacity-50"
            >
              {deletingId === c.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
