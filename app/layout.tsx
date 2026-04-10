import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AirGuard — Asthma Risk Predictor",
  description: "Predict your asthma risk using real-time AQI data and optional wearable biometrics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ background: "var(--bg-primary)", display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ marginLeft: "220px", flex: 1, minHeight: "100vh", padding: "40px 48px" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
