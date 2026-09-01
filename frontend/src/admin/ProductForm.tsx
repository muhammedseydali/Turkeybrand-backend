import { useEffect, useState } from "react";
import { api, Category, Material, Size, Color } from "../api";
import { useToast } from "../context/ToastContext";

interface VariantRow { size_id: number; color_id: number; stock_quantity: number; }

export default function ProductForm({ productId, onSaved, onClose }: { productId: number | null; onSaved: () => void; onClose: () => void }) {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", description: "", category_id: "", material_id: "", brand: "Turkeybrand",
    sku: "", product_type: "shirt", price: "", sale_price: "", status: "active",
    is_new_arrival: false, is_best_seller: false, image_urls: "",
  });
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [selectedColors, setSelectedColors] = useState<number[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const loadCategories = () => api.get("/api/categories").then((r) => setCategories(r.data));

  const submitNewCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    setSavingCategory(true);
    try {
      const { data } = await api.post("/api/admin/categories", { name: trimmed });
      await loadCategories();
      update("category_id", String(data.id));
      setNewCategoryName("");
      setAddingCategory(false);
      toast.show("Category added", "success");
    } catch (err: any) {
      toast.show(err?.response?.data?.detail || "Couldn't add category", "error");
    } finally {
      setSavingCategory(false);
    }
  };

  useEffect(() => {
    loadCategories();
    api.get("/api/materials").then((r) => setMaterials(r.data));
    api.get("/api/sizes").then((r) => setSizes(r.data));
    api.get("/api/colors").then((r) => setColors(r.data));
  }, []);

  useEffect(() => {
    if (!productId) return;
    api.get(`/api/admin/products`).then((r) => {
      // fetch detail via slug lookup isn't available by id, so find card then fetch by slug
      const card = r.data.find((p: any) => p.id === productId);
      if (card) {
        api.get(`/api/products/${card.slug}`).then((res) => {
          const p = res.data;
          setForm({
            name: p.name, description: p.description, category_id: p.category?.id ?? "",
            material_id: p.material?.id ?? "", brand: p.brand, sku: p.sku, product_type: p.product_type,
            price: p.price, sale_price: p.sale_price ?? "", status: p.status,
            is_new_arrival: p.is_new_arrival, is_best_seller: p.is_best_seller,
            image_urls: p.images.map((i: any) => i.image_url).join("\n"),
          });
          const sIds = Array.from(new Set(p.variants.map((v: any) => v.size.id))) as number[];
          const cIds = Array.from(new Set(p.variants.map((v: any) => v.color.id))) as number[];
          setSelectedSizes(sIds);
          setSelectedColors(cIds);
          const sm: Record<string, number> = {};
          p.variants.forEach((v: any) => { sm[`${v.size.id}-${v.color.id}`] = v.stock_quantity; });
          setStockMap(sm);
        });
      }
    });
  }, [productId]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSize = (id: number) => setSelectedSizes((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleColor = (id: number) => setSelectedColors((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const buildVariants = (): VariantRow[] => {
    const rows: VariantRow[] = [];
    selectedSizes.forEach((sId) => selectedColors.forEach((cId) => {
      rows.push({ size_id: sId, color_id: cId, stock_quantity: stockMap[`${sId}-${cId}`] ?? 0 });
    }));
    return rows;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name, description: form.description,
      category_id: form.category_id ? Number(form.category_id) : null,
      material_id: form.material_id ? Number(form.material_id) : null,
      brand: form.brand, sku: form.sku, product_type: form.product_type,
      price: Number(form.price), sale_price: form.sale_price ? Number(form.sale_price) : null,
      status: form.status, is_new_arrival: form.is_new_arrival, is_best_seller: form.is_best_seller,
      image_urls: form.image_urls.split("\n").map((s) => s.trim()).filter(Boolean),
      variants: buildVariants(),
    };
    try {
      if (productId) {
        const { sku, product_type, ...updatePayload } = payload as any;
        await api.put(`/api/admin/products/${productId}`, updatePayload);
        toast.show("Product updated", "success");
      } else {
        await api.post("/api/admin/products", payload);
        toast.show("Product created", "success");
      }
      onSaved();
    } catch (err: any) {
      toast.show(err?.response?.data?.detail || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <input required placeholder="Product name" value={form.name} onChange={(e) => update("name", e.target.value)} className="col-span-2 border border-line rounded-sm px-3 py-2" />
        <select value={form.product_type} disabled={!!productId} onChange={(e) => update("product_type", e.target.value)} className="border border-line rounded-sm px-3 py-2 disabled:bg-line/40">
          <option value="shirt">Shirt</option>
          <option value="tshirt">T-Shirt</option>
        </select>
        <input required placeholder="SKU" disabled={!!productId} value={form.sku} onChange={(e) => update("sku", e.target.value)} className="border border-line rounded-sm px-3 py-2 disabled:bg-line/40" />
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2">
            <select value={form.category_id} onChange={(e) => update("category_id", e.target.value)} className="flex-1 border border-line rounded-sm px-3 py-2">
              <option value="">Category...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              type="button"
              onClick={() => setAddingCategory((v) => !v)}
              className="px-3 border border-line rounded-sm text-xs text-muted hover:text-ink hover:border-ink whitespace-nowrap"
            >
              + New
            </button>
          </div>
          {addingCategory && (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitNewCategory(); } }}
                placeholder="New category name"
                className="flex-1 border border-line rounded-sm px-3 py-1.5 text-xs"
              />
              <button
                type="button"
                disabled={savingCategory || !newCategoryName.trim()}
                onClick={submitNewCategory}
                className="px-3 py-1 bg-ink text-paper rounded-sm text-xs disabled:opacity-50"
              >
                {savingCategory ? "Adding..." : "Add"}
              </button>
              <button type="button" onClick={() => { setAddingCategory(false); setNewCategoryName(""); }} className="px-2 text-xs text-muted hover:text-ink">
                Cancel
              </button>
            </div>
          )}
        </div>
        <select value={form.material_id} onChange={(e) => update("material_id", e.target.value)} className="border border-line rounded-sm px-3 py-2">
          <option value="">Material...</option>
          {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => update("price", e.target.value)} className="border border-line rounded-sm px-3 py-2" />
        <input type="number" step="0.01" placeholder="Sale price (optional)" value={form.sale_price} onChange={(e) => update("sale_price", e.target.value)} className="border border-line rounded-sm px-3 py-2" />
        <select value={form.status} onChange={(e) => update("status", e.target.value)} className="border border-line rounded-sm px-3 py-2">
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <div className="flex items-center gap-4 col-span-2">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_new_arrival} onChange={(e) => update("is_new_arrival", e.target.checked)} /> New arrival</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_best_seller} onChange={(e) => update("is_best_seller", e.target.checked)} /> Best seller</label>
        </div>
      </div>

      <textarea placeholder="Description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} className="w-full border border-line rounded-sm px-3 py-2" />
      <textarea placeholder="Image URLs, one per line" value={form.image_urls} onChange={(e) => update("image_urls", e.target.value)} rows={2} className="w-full border border-line rounded-sm px-3 py-2" />

      <div>
        <div className="font-medium text-ink mb-2">Sizes</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {sizes.map((s) => (
            <button type="button" key={s.id} onClick={() => toggleSize(s.id)} className={"px-3 py-1.5 rounded-sm border text-xs " + (selectedSizes.includes(s.id) ? "bg-ink text-paper border-ink" : "border-line")}>
              {s.name}
            </button>
          ))}
        </div>
        <div className="font-medium text-ink mb-2">Colors</div>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button type="button" key={c.id} onClick={() => toggleColor(c.id)} className={"w-8 h-8 rounded-full border-2 " + (selectedColors.includes(c.id) ? "border-brick" : "border-line")} style={{ backgroundColor: c.hex_code }} title={c.name} />
          ))}
        </div>
      </div>

      {selectedSizes.length > 0 && selectedColors.length > 0 && (
        <div>
          <div className="font-medium text-ink mb-2">Stock per size / color</div>
          <div className="overflow-x-auto">
            <table className="text-xs w-full border border-line">
              <thead>
                <tr className="bg-paper">
                  <th className="p-2 text-left">Size</th>
                  {selectedColors.map((cId) => (
                    <th key={cId} className="p-2">{colors.find((c) => c.id === cId)?.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedSizes.map((sId) => (
                  <tr key={sId} className="border-t border-line">
                    <td className="p-2 font-medium">{sizes.find((s) => s.id === sId)?.name}</td>
                    {selectedColors.map((cId) => (
                      <td key={cId} className="p-2">
                        <input
                          type="number" min={0}
                          value={stockMap[`${sId}-${cId}`] ?? 0}
                          onChange={(e) => setStockMap((prev) => ({ ...prev, [`${sId}-${cId}`]: Number(e.target.value) }))}
                          className="w-16 border border-line rounded-sm px-1 py-1"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 text-muted hover:text-ink">Cancel</button>
        <button disabled={saving} className="bg-brick text-paper px-5 py-2 rounded-sm font-medium hover:bg-brick-dark disabled:opacity-60">
          {saving ? "Saving..." : productId ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
