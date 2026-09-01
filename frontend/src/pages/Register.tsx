import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      toast.show("Account created", "success");
      navigate("/account/orders");
    } catch (err: any) {
      toast.show(err?.response?.data?.detail || "Could not create account", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-shell py-20 max-w-sm mx-auto">
      <h1 className="font-display text-3xl text-ink mb-8">Create an account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input required placeholder="Full name" onChange={(e) => update("name", e.target.value)} className="w-full border border-line rounded-sm px-3 py-2" />
        <input required type="email" placeholder="Email" onChange={(e) => update("email", e.target.value)} className="w-full border border-line rounded-sm px-3 py-2" />
        <input placeholder="Phone (optional)" onChange={(e) => update("phone", e.target.value)} className="w-full border border-line rounded-sm px-3 py-2" />
        <input required type="password" placeholder="Password" onChange={(e) => update("password", e.target.value)} className="w-full border border-line rounded-sm px-3 py-2" />
        <button disabled={submitting} className="w-full bg-ink text-paper py-3 rounded-sm font-medium hover:bg-ink/90 disabled:opacity-60">
          {submitting ? "Creating..." : "Create account"}
        </button>
      </form>
      <p className="text-sm text-muted mt-6">
        Already have an account? <Link to="/login" className="text-brick hover:underline">Log in</Link>
      </p>
    </div>
  );
}
