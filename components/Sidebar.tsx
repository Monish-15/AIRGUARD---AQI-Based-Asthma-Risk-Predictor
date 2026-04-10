"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  HeartPulse, LayoutDashboard, User,
  Activity, Brain, Map, Wind, Watch, Scale, LogIn, LogOut
} from "lucide-react";

const NAV = [
  { href: "/",         label: "Predictor",   icon: LayoutDashboard, desc: "Risk assessment" },
  { href: "/compare",  label: "Compare",     icon: Scale,           desc: "City comparison" },
  { href: "/timeline", label: "Timeline",    icon: Activity,        desc: "30-day history" },
  { href: "/insights", label: "AI Insights", icon: Brain,           desc: "Attack patterns" },
  { href: "/map",      label: "Safe Zones",  icon: Map,             desc: "Dynamic API map" },
  { href: "/profile",  label: "My Profile",  icon: User,            desc: "Health settings" },
  { href: "/login",    label: "Account",     icon: LogIn,           desc: "Sign in / out" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("userId"));
  }, []);

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0,
      height: "100vh", width: "220px",
      background: "#ffffff",
      borderRight: "1px solid #e2e8f0",
      display: "flex", flexDirection: "column",
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "10px",
            background: "linear-gradient(135deg, #2563eb, #0891b2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <HeartPulse size={17} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "15px", color: "#0f172a", letterSpacing: "-0.01em" }}>AirGuard</div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>Risk Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px", flex: 1 }}>
        <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#cbd5e1", padding: "0 10px", marginBottom: "6px" }}>
          Navigation
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV.map(({ href, label, icon: Icon, desc }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 10px", borderRadius: "10px",
                textDecoration: "none",
                background: active ? "#eff6ff" : "transparent",
                borderLeft: active ? "3px solid #2563eb" : "3px solid transparent",
                transition: "all 0.15s ease",
              }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Icon size={16} color={active ? "#2563eb" : "#94a3b8"} />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: active ? 700 : 500, color: active ? "#2563eb" : "#334155" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>{desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer badge */}
      <div style={{ padding: "16px 12px" }}>
        <div style={{
          background: "#f8fafc", border: "1px solid #e2e8f0",
          borderRadius: "10px", padding: "10px 12px",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <Wind size={14} color="#059669" />
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>Live Mode</div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>OpenWeather API Active</div>
          </div>
        </div>
        
        {/* Logout Button if logged in */}
        {isLoggedIn && (
          <button 
            onClick={() => {
              localStorage.removeItem("userId");
              localStorage.removeItem("token");
              localStorage.removeItem("userName");
              window.location.href = "/login";
            }}
            style={{
              width: "100%", marginTop: "12px", padding: "10px", borderRadius: "10px",
              background: "#fef2f2", border: "1px solid #fee2e2", color: "#dc2626",
              fontSize: "12px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              fontFamily: "inherit"
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        )}
      </div>

    </aside>
  );
}
