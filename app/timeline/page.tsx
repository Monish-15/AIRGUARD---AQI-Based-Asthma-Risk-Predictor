"use client";
import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function genDemoTimeline(n = 30) {
  const data = [];
  let baseAqi = 90;
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    baseAqi = Math.max(30, Math.min(250, baseAqi + (Math.random() - 0.45) * 30));
    const risk = Math.min(100, (baseAqi / 300) * 100 * (1 + Math.random() * 0.3));
    const symptom = baseAqi > 150 ? Math.floor(Math.random() * 3) + 1
      : (baseAqi > 100 ? (Math.random() > 0.6 ? 1 : 0) : 0);
    data.push({
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      aqi: Math.round(baseAqi),
      risk: Math.round(risk),
      symptoms: symptom,
    });
  }
  return data;
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px",
      padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px",
    }}>
      <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function TimelinePage() {
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [loggedSymptom, setLoggedSymptom] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimelineData(genDemoTimeline(30));
    setMounted(true);
  }, []);

  if (!mounted) return null; // Prevent hydration jump


  const symptomLevels = [
    { label: "None",     color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
    { label: "Mild",     color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
    { label: "Moderate", color: "#ea580c", bg: "#fff7ed", border: "#fdba74" },
    { label: "Severe",   color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
  ];

  return (
    <div style={{ maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Activity size={22} color="#059669" />
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>Health Timeline</h1>
        </div>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
          30-day overlay of AQI levels, predicted risk scores, and reported symptoms.
        </p>
      </div>

      {/* AQI vs Risk chart */}
      <div className="animate-in" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>AQI vs Risk Score — Last 30 Days</span>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
            <span style={{ color: "#0891b2" }}>● AQI Level</span>
            <span style={{ color: "#dc2626" }}>- - Risk Score (%)</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={timelineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={4} />
            <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 300]} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 100]} />
            <Tooltip content={<ChartTooltip />} />
            <Line yAxisId="left"  type="monotone" dataKey="aqi"  stroke="#0891b2" strokeWidth={2} dot={false} name="AQI" />
            <Line yAxisId="right" type="monotone" dataKey="risk" stroke="#dc2626" strokeWidth={2} dot={false} name="Risk %" strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Symptom bar strip */}
      <div className="animate-in" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Symptom Level — Last 30 Days</span>
          <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
            <span style={{ color: "#cbd5e1" }}>■ None</span>
            <span style={{ color: "#d97706" }}>■ Mild</span>
            <span style={{ color: "#ea580c" }}>■ Moderate</span>
            <span style={{ color: "#dc2626" }}>■ Severe</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "3px", height: "56px", alignItems: "flex-end" }}>
          {timelineData.map((d, i) => {
            const colors = ["#e2e8f0", "#fcd34d", "#fdba74", "#fca5a5"];
            const heights = [10, 28, 44, 56];
            return (
              <div key={i} style={{
                flex: 1, borderRadius: "3px 3px 0 0", minWidth: "6px",
                height: heights[d.symptoms] + "px",
                background: colors[d.symptoms],
                cursor: "pointer", transition: "opacity 0.15s",
              }}
                title={`${d.date}: Symptom Level ${d.symptoms}`}
              />
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
          <span>30 days ago</span><span>Today</span>
        </div>
      </div>

      {/* Log today */}
      <div className="animate-in" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        <div style={{ marginBottom: "6px", fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>📝 Log Today&apos;s Symptoms</div>
        <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 18px 0" }}>
          Save your profile first, then log symptoms to build your personal model.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {symptomLevels.map((s, i) => {
            const active = loggedSymptom === i;
            return (
              <button
                key={s.label}
                onClick={() => setLoggedSymptom(i)}
                style={{
                  padding: "11px", borderRadius: "10px", cursor: "pointer",
                  border: `2px solid ${active ? s.border : "#e2e8f0"}`,
                  background: active ? s.bg : "#fafafa",
                  color: active ? s.color : "#64748b",
                  fontSize: "13px", fontWeight: active ? 700 : 500,
                  transition: "all 0.15s ease", fontFamily: "inherit",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        {loggedSymptom !== null && (
          <div style={{ marginTop: "14px", fontSize: "13px", color: "#059669", display: "flex", alignItems: "center", gap: "6px" }}>
            ✓ Symptom level "{symptomLevels[loggedSymptom].label}" noted for today.
          </div>
        )}
      </div>
    </div>
  );
}
