import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

type Mode = "password" | "otp";
type OtpStage = "phone" | "code";

export default function Login() {
  const { login, requestOtp, verifyOtp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("password");
  const [submitting, setSubmitting] = useState(false);

  // Password login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP login
  const [otpStage, setOtpStage] = useState<OtpStage>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.show("Welcome back", "success");
      navigate("/account/orders");
    } catch {
      toast.show("Invalid email or password", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startCooldown = () => {
    setCooldown(30);
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!/^\d{10}$/.test(phone.trim())) {
      toast.show("Enter a valid 10-digit mobile number", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await requestOtp(phone.trim());
      setOtpStage("code");
      setDebugOtp(res.debug_otp);
      setOtp(res.debug_otp); // auto-populate the temporary OTP for instant convenience
      startCooldown();
      toast.show(`Your temporary verification OTP is ${res.debug_otp}`, "info");
    } catch (err: any) {
      toast.show(err?.response?.data?.detail || "Couldn't send OTP", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verifyOtp(phone.trim(), otp.trim());
      toast.show("Welcome!", "success");
      navigate("/account/orders");
    } catch (err: any) {
      toast.show(err?.response?.data?.detail || "Incorrect OTP", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-shell py-20 max-w-sm mx-auto">
      <h1 className="font-display text-3xl text-ink mb-6">Log in</h1>

      <div className="flex border border-line rounded-sm mb-6 overflow-hidden text-sm">
        <button
          onClick={() => setMode("password")}
          className={"flex-1 py-2 font-medium " + (mode === "password" ? "bg-ink text-paper" : "text-muted hover:text-ink")}
        >
          Email &amp; Password
        </button>
        <button
          onClick={() => setMode("otp")}
          className={"flex-1 py-2 font-medium " + (mode === "otp" ? "bg-ink text-paper" : "text-muted hover:text-ink")}
        >
          Mobile OTP
        </button>
      </div>

      {mode === "password" ? (
        <>
          <p className="text-muted mb-6 text-sm">Demo account: rahul@example.com / password123</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-line rounded-sm px-3 py-2" />
            <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-line rounded-sm px-3 py-2" />
            <button disabled={submitting} className="w-full bg-ink text-paper py-3 rounded-sm font-medium hover:bg-ink/90 disabled:opacity-60">
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>
        </>
      ) : otpStage === "phone" ? (
        <>
          <p className="text-muted mb-4 text-sm">Enter your 10-digit mobile number to sign in.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs text-muted self-center">Demo numbers:</span>
            <button
              type="button"
              onClick={() => setPhone("9876543210")}
              className="text-xs bg-line/50 hover:bg-line px-2 py-1 rounded text-ink font-mono"
            >
              9876543210 (Rahul)
            </button>
            <button
              type="button"
              onClick={() => setPhone("9876500000")}
              className="text-xs bg-line/50 hover:bg-line px-2 py-1 rounded text-ink font-mono"
            >
              9876500000 (Anjali)
            </button>
          </div>
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input
              required type="tel" placeholder="10-digit mobile number" value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-full border border-line rounded-sm px-3 py-2 font-mono text-sm"
            />
            <button disabled={submitting} className="w-full bg-ink text-paper py-3 rounded-sm font-medium hover:bg-ink/90 disabled:opacity-60">
              {submitting ? "Generating Code..." : "Send OTP"}
            </button>
          </form>
          <p className="text-xs text-muted/80 mt-4 leading-relaxed">
            * In demo mode, SMS sending is simulated. The temporary OTP code will be shown directly on screen below.
          </p>
        </>
      ) : (
        <>
          <p className="text-muted mb-4 text-sm">
            Enter the code sent to <span className="text-ink font-semibold font-mono">{phone}</span>.
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              required inputMode="numeric" placeholder="6-digit code" value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full border border-line rounded-sm px-3 py-2.5 tracking-[0.35em] text-center font-mono text-lg bg-panel"
            />

            {/* Temporary / Demo OTP Card */}
            {debugOtp && (
              <div className="p-3.5 bg-mustard/15 border border-mustard/40 rounded-sm text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Temporary Code:
                  </span>
                  <span className="font-mono text-sm tracking-widest bg-paper px-2.5 py-0.5 rounded border border-line text-ink font-bold">
                    {debugOtp}
                  </span>
                </div>
                <div className="flex items-center justify-between text-ink/75 pt-0.5">
                  <span className="text-[11px] text-muted">Demo mode — no physical SMS sent</span>
                  <button
                    type="button"
                    onClick={() => setOtp(debugOtp)}
                    className="text-brick font-medium hover:underline text-xs"
                  >
                    Autofill: {debugOtp}
                  </button>
                </div>
              </div>
            )}

            <button disabled={submitting || otp.length < 6} className="w-full bg-ink text-paper py-3 rounded-sm font-medium hover:bg-ink/90 disabled:opacity-60">
              {submitting ? "Verifying..." : "Verify & Log In"}
            </button>
          </form>

          <div className="flex justify-between items-center mt-4 text-sm">
            <button onClick={() => { setOtpStage("phone"); setOtp(""); setDebugOtp(null); }} className="text-muted hover:text-ink text-xs">
              ← Change number
            </button>
            <button
              onClick={() => handleSendOtp()}
              disabled={cooldown > 0 || submitting}
              className="text-brick hover:underline text-xs disabled:opacity-50 disabled:no-underline font-medium"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
            </button>
          </div>
        </>
      )}

      <p className="text-sm text-muted mt-6">
        New here? <Link to="/register" className="text-brick hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
