import { useEffect, useMemo, useState } from "react";
import { api, ProductCard, CategoryWithCount, money } from "../api";
import { useToast } from "../context/ToastContext";
import { PageHeader, Badge } from "./ui";
import { Modal } from "./ui";
import ProductForm from "./ProductForm";
import CategoryManager from "./CategoryManager";

export default function Products() {
  const [items, setItems] = useState<ProductCard[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null); // null = "All"
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const toast = useToast();

  const loadProducts = () => {
    setLoading(true);
    api.get("/api/admin/products").then((r) => setItems(r.data)).finally(() => setLoading(false));
  };

  const loadCategories = () => {
    api.get("/api/admin/categories").then((r) => setCategories(r.data));
  };

  useEffect(() => { loadProducts(); loadCategories(); }, []);

  const openCreate = () => { setEditingId(null); setModalOpen(true); };
  const openEdit = (id: number) => { setEditingId(id); setModalOpen(true); };

  const onSaved = () => { setModalOpen(false); loadProducts(); loadCategories(); };
  const onCategoriesChanged = () => { loadCategories(); loadProducts(); };

  const remove = async (id: number) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await api.delete(`/api/admin/products/${id}`);
      toast.show("Product deleted", "success");
      loadProducts();
      loadCategories();
    } catch {
      toast.show("Delete failed", "error");
    }
  };

  const toggleStatus = async (id: number) => {
    await api.post(`/api/admin/products/${id}/toggle-status`);
    loadProducts();
  };

  // Instant, client-side filter — no refetch needed when switching tabs.
  const filteredItems = useMemo(
    () => (activeCategory ? items.filter((p) => p.category === activeCategory) : items),
    [items, activeCategory]
  );

  return (
    <div>
      <PageHeader
        title="Products"
        action={<button onClick={openCreate} className="bg-brick text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-brick-dark">+ Add product</button>}
      />
      <div className="px-8 pb-8">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={"px-3 py-1.5 rounded-sm text-sm border " + (activeCategory === null ? "bg-ink text-paper border-ink" : "border-line hover:border-ink")}
          >
            All ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.name)}
              className={"px-3 py-1.5 rounded-sm text-sm border " + (activeCategory === c.name ? "bg-ink text-paper border-ink" : "border-line hover:border-ink")}
            >
              {c.name} ({items.filter((p) => p.category === c.name).length})
            </button>
          ))}
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="px-3 py-1.5 rounded-sm text-sm border border-dashed border-line text-muted hover:text-ink hover:border-ink"
          >
            + Manage Categories
          </button>
        </div>

        {loading ? (
          <div className="text-muted">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-muted text-sm py-8 text-center border border-line rounded-sm bg-panel">
            No products in this category yet.
          </div>
        ) : (
          <div className="bg-panel border border-line rounded-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper text-left text-muted">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="p-3 flex items-center gap-3">
                      {p.thumbnail && <img src={p.thumbnail} className="w-9 h-11 object-cover rounded-sm" />}
                      <span className="font-medium text-ink">{p.name}</span>
                    </td>
                    <td className="p-3 text-muted">{p.category || "—"}</td>
                    <td className="p-3 capitalize">{p.product_type}</td>
                    <td className="p-3 text-muted">{p.sku}</td>
                    <td className="p-3">{p.sale_price ? money(p.sale_price) : money(p.price)}</td>
                    <td className="p-3">
                      {p.total_stock === 0 ? <Badge text="out of stock" tone="bad" /> : p.total_stock <= 15 ? <Badge text={`${p.total_stock} low`} tone="warn" /> : p.total_stock}
                    </td>
                    <td className="p-3"><Badge text={p.status} tone={p.status === "active" ? "good" : "default"} /></td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(p.id)} className="text-brick hover:underline mr-3">Edit</button>
                      <button onClick={() => toggleStatus(p.id)} className="text-muted hover:text-ink mr-3">
                        {p.status === "active" ? "Archive" : "Activate"}
                      </button>
                      <button onClick={() => remove(p.id)} className="text-muted hover:text-brick">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit product" : "Add product"} wide>
        <ProductForm productId={editingId} onSaved={onSaved} onClose={() => setModalOpen(false)} />
      </Modal>

      <CategoryManager
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onChanged={onCategoriesChanged}
      />
    </div>
  );
}
