"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartPulse, LayoutDashboard, User, Activity, Brain, Map } from "lucide-react";

const NAV = [
  { href: "/", label: "Predictor", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/timeline", label: "Timeline", icon: Activity },
  { href: "/insights", label: "AI Insights", icon: Brain },
  { href: "/map", label: "Safe Zones", icon: Map },
];

export default function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="top-nav">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2563eb, #0891b2)" }}>
            <HeartPulse size={15} color="white" />
          </div>
          <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "15px", letterSpacing: "-0.01em" }}>
            AirGuard
          </span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="nav-link"
                style={active ? {
                  background: "#eff6ff",
                  color: "#2563eb",
                  fontWeight: 600,
                } : {}}
              >
                <Icon size={13} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
