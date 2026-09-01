import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function AdminLogin() {
  const { login, user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(email.trim().toLowerCase(), password.trim());
      if (u.role !== "admin") {
        logout();
        toast.show("This account doesn't have admin access", "error");
        return;
      }
      navigate("/admin/dashboard");
    } catch {
      toast.show("Invalid email or password", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="bg-panel rounded-sm p-8 w-full max-w-sm">
        <div className="font-display text-2xl text-ink mb-1">Turkeybrand Admin</div>
        <p className="text-muted text-sm mb-6">
          {user ? "Signed in as a non-admin account." : "Demo login: admin@turkeybrand.dev / Admin@123"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="email" placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-line rounded-sm px-3 py-2" />
          <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-line rounded-sm px-3 py-2" />
          <button disabled={submitting} className="w-full bg-brick text-paper py-3 rounded-sm font-medium hover:bg-brick-dark disabled:opacity-60">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
