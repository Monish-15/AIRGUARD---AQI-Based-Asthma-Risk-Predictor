"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "@/lib/api";
import { HeartPulse, Mail, Lock, User as UserIcon, Smartphone, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone_number: "" });

  // Redirect if already logged in
  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.push("/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Success Login
        const res = await loginUser({ email: form.email, password: form.password });
        localStorage.setItem("userId", res.user_id);
        localStorage.setItem("token", res.access_token);
        localStorage.setItem("userName", res.name);
        
        // Visual feedback before redirect
        setError({ msg: "Login successful! Redirecting...", type: "success" });
        setTimeout(() => router.push("/"), 800);
      } else {
        // Registration
        const res = await registerUser(form);
        
        // Use the token returned by registration immediately
        localStorage.setItem("userId", String(res.user_id));
        localStorage.setItem("token", res.access_token);
        localStorage.setItem("userName", res.name);
        
        setError({ msg: "Account created! Welcome to AirGuard.", type: "success" });
        setTimeout(() => router.push("/"), 1200);
      }
    } catch (err: any) {
      setError({ msg: err.message || "Authentication failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(circle at top right, #eff6ff, #f8fafc)", padding: "24px",
      fontFamily: "inherit"
    }}>
      <div style={{
        maxWidth: "440px", width: "100%", background: "rgba(255, 255, 255, 0.8)", 
        backdropFilter: "blur(20px)", padding: "48px 40px",
        borderRadius: "32px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.08)",
        border: "1px solid rgba(255,255,255,0.7)",
      }}>
        
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "18px",
            background: "linear-gradient(135deg, #2563eb 0%, #0891b2 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.3)"
          }}>
            <HeartPulse size={28} color="white" />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.03em" }}>
            AirGuard
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px", marginTop: "8px", fontWeight: 500 }}>
            {isLogin ? "Sign in to monitor your respiratory health" : "Join the proactive health revolution"}
          </p>
        </div>

        {error && (
          <div className="animate-in" style={{
            background: error.type === "success" ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${error.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            color: error.type === "success" ? "#15803d" : "#b91c1c",
            padding: "14px", borderRadius: "14px", fontSize: "13.5px", 
            marginBottom: "24px", textAlign: "center", fontWeight: 600,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}>
            {error.type === "success" && <ShieldCheck size={16} />}
            {error.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {!isLogin && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Full Name</label>
              <div style={{ position: "relative" }}>
                <UserIcon size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  required type="text" placeholder="e.g. Monish Kumar"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ 
                    width: "100%", padding: "14px 14px 14px 44px", borderRadius: "14px", 
                    border: "1px solid #e2e8f0", outline: "none", fontSize: "14.5px",
                    background: "#fcfdfe", transition: "all 0.2s"
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <Mail size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                required type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ 
                  width: "100%", padding: "14px 14px 14px 44px", borderRadius: "14px", 
                  border: "1px solid #e2e8f0", outline: "none", fontSize: "14.5px",
                  background: "#fcfdfe", transition: "all 0.2s"
                }}
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>Phone Number</label>
              <div style={{ position: "relative" }}>
                <Smartphone size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="tel" placeholder="+91 98765 43210"
                  value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })}
                  style={{ 
                    width: "100%", padding: "14px 14px 14px 44px", borderRadius: "14px", 
                    border: "1px solid #e2e8f0", outline: "none", fontSize: "14.5px",
                    background: "#fcfdfe", transition: "all 0.2s"
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>Password</label>
              {isLogin && <a href="#" style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Forgot?</a>}
            </div>
            <div style={{ position: "relative" }}>
              <Lock size={18} color="#94a3b8" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                required type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ 
                  width: "100%", padding: "14px 14px 14px 44px", borderRadius: "14px", 
                  border: "1px solid #e2e8f0", outline: "none", fontSize: "14.5px",
                  background: "#fcfdfe", transition: "all 0.2s"
                }}
              />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            style={{
              marginTop: "12px", padding: "16px", borderRadius: "16px", 
              background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)", color: "white",
              border: "none", fontWeight: 800, fontSize: "16px",
              cursor: loading ? "not-allowed" : "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: "10px",
              boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)",
              transition: "transform 0.2s, background 0.2s, box-shadow 0.2s",
            }}
            onMouseOver={e => !loading && (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseOut={e => !loading && (e.currentTarget.style.transform = "translateY(0)")}
          >
            {loading ? "Please wait..." : isLogin ? "Access Dashboard" : "Register Profile"}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "32px", borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            style={{ 
              background: "none", border: "none", color: "#2563eb", 
              fontSize: "14.5px", fontWeight: 700, cursor: "pointer",
              transition: "color 0.2s"
            }}
          >
            {isLogin ? "New here? Create health profile" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
