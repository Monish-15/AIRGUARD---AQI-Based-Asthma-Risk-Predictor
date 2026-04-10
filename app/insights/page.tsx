"use client";
import { useEffect, useState } from "react";
import { getInsights } from "@/lib/api";
import { Brain, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const DEMO_INSIGHTS = {
  user_id: 1, total_logs: 45, total_attacks: 12, attack_rate_percent: 26.7,
  top_triggers: [
    { name: "PM2.5",    rate: 83.3 },
    { name: "Humidity", rate: 75.0 },
    { name: "NO₂",      rate: 58.3 },
    { name: "PM10",     rate: 50.0 },
    { name: "O₃",       rate: 33.3 },
  ],
  worst_time: "Evening (17-21)",
  hour_distribution: {
    "Morning (6-10)": 3, "Afternoon (11-16)": 2,
    "Evening (17-21)": 5, "Night (22-5)": 2,
  },
  personalized_tips: [
    "Your #1 trigger is PM2.5 — present in 83% of attacks.",
    "Evening hours are your riskiest — limit outdoor activity 5–9 PM.",
    "Your attack frequency is high. Consider consulting your doctor about preventive medication.",
  ],
};

const TRIGGER_COLORS = ["#dc2626", "#ea580c", "#d97706", "#7c3aed", "#0891b2"];

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (uid) {
      getInsights(Number(uid))
        .then(setData).catch(() => setData(DEMO_INSIGHTS))
        .finally(() => setLoading(false));
    } else { setData(DEMO_INSIGHTS); setLoading(false); }
  }, []);

  if (loading) return (
    <div>
      <div className="skeleton" style={{ height: "36px", width: "200px", marginBottom: "32px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: "100px", borderRadius: "14px" }} />)}
      </div>
    </div>
  );

  const insights = data ?? DEMO_INSIGHTS;
  const hourData = Object.entries(insights.hour_distribution).map(([k, v]) => ({ time: k.split(" ")[0], attacks: v }));

  return (
    <div style={{ maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Brain size={22} color="#7c3aed" />
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>AI Insights</h1>
        </div>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
          Personalized patterns mined from your attack history and environmental data.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        {[
          { label: "Total Logs",    value: insights.total_logs,           icon: "📋", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
          { label: "Attacks Logged", value: insights.total_attacks,       icon: "⚡", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
          { label: "Attack Rate",   value: `${insights.attack_rate_percent}%`, icon: "📈", color: "#ea580c", bg: "#fff7ed", border: "#fdba74" },
        ].map(({ label, value, icon, color, bg, border }) => (
          <div key={label} className="animate-in" style={{
            background: bg, border: `1px solid ${border}`,
            borderRadius: "14px", padding: "20px 24px",
            display: "flex", alignItems: "center", gap: "16px",
          }}>
            <span style={{ fontSize: "28px" }}>{icon}</span>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>{label}</div>
              <div style={{ fontSize: "28px", fontWeight: 900, color, lineHeight: 1.1, marginTop: "2px" }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* Top Triggers */}
        <div className="animate-in" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <TrendingUp size={15} color="#dc2626" />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Top Attack Triggers</span>
            <span style={{ marginLeft: "auto", fontSize: "11px", color: "#94a3b8" }}>% of attacks</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {insights.top_triggers.map((t: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "64px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#64748b" }}>{t.name}</div>
                <div style={{ flex: 1, height: "8px", borderRadius: "99px", background: "#f1f5f9" }}>
                  <div style={{ height: "8px", borderRadius: "99px", width: `${t.rate}%`, background: TRIGGER_COLORS[i], transition: "width 0.7s ease" }} />
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, width: "40px", color: TRIGGER_COLORS[i] }}>{t.rate}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Time distribution */}
        <div className="animate-in" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <AlertCircle size={15} color="#d97706" />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Attack Time Distribution</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={hourData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                itemStyle={{ color: "#ea580c" }}
              />
              <Bar dataKey="attacks" radius={[6, 6, 0, 0]}>
                {hourData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.time === "Evening" ? "#ea580c" : "#bfdbfe"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: "12px", marginTop: "8px", color: "#94a3b8" }}>
            ⚠️ Riskiest window: <span style={{ color: "#ea580c", fontWeight: 600 }}>{insights.worst_time}</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      {insights.personalized_tips?.length > 0 && (
        <div className="animate-in" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <Lightbulb size={15} color="#d97706" />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Personalized Recommendations</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {insights.personalized_tips.map((tip: string, i: number) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "14px 16px", borderRadius: "10px",
                background: "#fffbeb", border: "1px solid #fde68a",
              }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>💡</span>
                <span style={{ fontSize: "14px", color: "#334155", lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
