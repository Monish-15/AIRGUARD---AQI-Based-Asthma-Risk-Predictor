"use client";
import { useState, useEffect } from "react";
import {
  Brain, FileText, CheckCircle2, Zap, ShieldAlert, Award,
  Layers, BarChart3, Clock, Flame, Activity, ArrowDownRight,
  TrendingUp, Info, ChevronRight, Gauge
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { fetchModelMetrics } from "@/lib/api";

const BASELINE_DATA = [
  { name: "Logistic Reg.", accuracy: 74, f1: 72, kappa: 61, latency: 1.2, isOurs: false },
  { name: "Decision Tree", accuracy: 81, f1: 79, kappa: 71, latency: 0.8, isOurs: false },
  { name: "SVM (RBF)",     accuracy: 83, f1: 81, kappa: 75, latency: 32.7, isOurs: false },
  { name: "Random Forest", accuracy: 87, f1: 86, kappa: 81, latency: 18.4, isOurs: false },
  { name: "LSTM",          accuracy: 89, f1: 88, kappa: 83, latency: 145.3, isOurs: false },
  { name: "XGBoost (ours)", accuracy: 92, f1: 92, kappa: 88, latency: 8.6, isOurs: true },
];

const SHAP_DATA = [
  { feature: "PM2.5", weight: 24.1, category: "Raw Pollutant", fill: "#ef4444" },
  { feature: "PM2.5 × Humidity", weight: 17.6, category: "Engineered Interaction", fill: "#8b5cf6" },
  { feature: "O3 (Ozone)", weight: 14.5, category: "Raw Pollutant", fill: "#f97316" },
  { feature: "Oxidant burden", weight: 11.1, category: "Engineered Interaction", fill: "#8b5cf6" },
  { feature: "NO2", weight: 9.1, category: "Raw Pollutant", fill: "#eab308" },
  { feature: "Humidity", weight: 7.5, category: "Weather Telemetry", fill: "#06b6d4" },
  { feature: "Temp × PM10", weight: 5.9, category: "Engineered Interaction", fill: "#8b5cf6" },
  { feature: "PM10", weight: 4.9, category: "Raw Pollutant", fill: "#64748b" },
  { feature: "Temperature", weight: 3.7, category: "Weather Telemetry", fill: "#06b6d4" },
  { feature: "CO", weight: 1.6, category: "Raw Pollutant", fill: "#94a3b8" },
];

const ABLATION_DATA = [
  { config: "Full AirGuard", f1: 0.92, delta: "—", drop: 0, fill: "#10b981" },
  { config: "w/o Min-Max Norm", f1: 0.91, delta: "-0.01", drop: 0.01, fill: "#3b82f6" },
  { config: "w/o Outlier (MAD)", f1: 0.90, delta: "-0.02", drop: 0.02, fill: "#3b82f6" },
  { config: "w/o L2 Regularization", f1: 0.89, delta: "-0.03", drop: 0.03, fill: "#3b82f6" },
  { config: "w/o SMOTE Balance", f1: 0.88, delta: "-0.04", drop: 0.04, fill: "#f59e0b" },
  { config: "w/o Imputation", f1: 0.86, delta: "-0.06", drop: 0.06, fill: "#ea580c" },
  { config: "w/o Feature Eng.", f1: 0.84, delta: "-0.08", drop: 0.08, fill: "#ef4444" },
  { config: "Raw Baseline Only", f1: 0.79, delta: "-0.13", drop: 0.13, fill: "#991b1b" },
];

const LATENCY_DATA = [
  { percentile: "P50", miss: 312, hit: 134 },
  { percentile: "P75", miss: 401, hit: 178 },
  { percentile: "P90", miss: 487, hit: 221 },
  { percentile: "P95", miss: 614, hit: 259 },
  { percentile: "P99", miss: 892, hit: 318 },
];

export default function ResearchPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "baselines" | "shap" | "ablation" | "pipeline">("overview");

  useEffect(() => {
    fetchModelMetrics().then(setMetrics).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Paper Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        borderRadius: "18px",
        padding: "32px",
        color: "#ffffff",
        marginBottom: "28px",
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15)",
        border: "1px solid #334155"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span style={{
            background: "rgba(59, 130, 246, 0.2)",
            color: "#60a5fa",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase"
          }}>
            Conference Paper Implementation
          </span>
          <span style={{ color: "#94a3b8", fontSize: "12px" }}>• 15,000 Labeled Records across 5 Indian Cities</span>
        </div>

        <h1 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 10px 0", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
          AirGuard: An Explainable AI-Based Asthma Risk Prediction and Alert System
        </h1>

        <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "0 0 18px 0", lineHeight: 1.6 }}>
          <b>Authors:</b> Monish Ram, Dr. J. Cynthia &nbsp;|&nbsp; <b>Institution:</b> Department of Data Science and Cyber Security, Karunya Institute of Technology and Sciences, Coimbatore, India
        </p>

        {/* 4 Stat Highlights */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          paddingTop: "18px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          {[
            { label: "Overall Accuracy", val: "92.0%", sub: "Stratified Test Split", color: "#10b981" },
            { label: "Weighted F1 Score", val: "0.92", sub: "Balanced across bands", color: "#38bdf8" },
            { label: "Cohen's Kappa (κ)", val: "0.88", sub: "Strong clinical agreement", color: "#a855f7" },
            { label: "Inference Latency", val: "8.6 ms", sub: "17x faster than LSTM", color: "#f59e0b" },
          ].map((s, idx) => (
            <div key={idx} style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "12px 16px"
            }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: s.color, marginTop: "2px" }}>{s.val}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
        {[
          { id: "overview", label: "Dataset & Class Distribution (Table VI & VII)", icon: FileText },
          { id: "baselines", label: "Baseline Model Comparison (Table VIII)", icon: BarChart3 },
          { id: "shap", label: "Explainable AI & SHAP (Figure 4)", icon: Brain },
          { id: "ablation", label: "Ablation Study (Table X & Fig 5)", icon: Layers },
          { id: "pipeline", label: "5-Stage Architecture & Latency (Table IX)", icon: Gauge },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#ffffff" : "#475569",
                background: isActive ? "#2563eb" : "#ffffff",
                border: isActive ? "1px solid #2563eb" : "1px solid #e2e8f0",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                boxShadow: isActive ? "0 4px 12px rgba(37, 99, 235, 0.2)" : "none"
              }}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW (Table VI & VII) */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Table VI */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                  Table VI: Class Distribution Across 15,000 Records
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  Hourly environmental readings collected across Chennai, Delhi, Mumbai, Bengaluru, and Hyderabad (2021–2023). Stratified 80/20 train/test split.
                </p>
              </div>
              <span style={{ fontSize: "12px", background: "#f1f5f9", padding: "4px 10px", borderRadius: "6px", color: "#475569", fontWeight: 600 }}>
                Expert Consensus κ = 0.84
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px", textAlign: "left", color: "#475569" }}>Risk Class</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "#475569" }}>Total Records</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "#475569" }}>Dataset Share</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#475569" }}>Clinical Action Guidance (Table III)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Low", count: "6,200", share: "41.3%", color: "#059669", bg: "#ecfdf5", act: "Normal outdoor activity" },
                    { label: "Moderate", count: "4,850", share: "32.3%", color: "#d97706", bg: "#fffbeb", act: "Reduce strenuous outdoor exertion, monitor symptoms" },
                    { label: "High", count: "2,900", share: "19.3%", color: "#ea580c", bg: "#fff7ed", act: "Stay indoors, keep rescue inhaler at hand, alert dispatched" },
                    { label: "Critical", count: "1,050", share: "7.0%", color: "#dc2626", bg: "#fef2f2", act: "Remain indoors, seal windows, seek medical advice, urgent alert dispatched" },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px" }}>
                        <span style={{ background: r.bg, color: r.color, padding: "4px 10px", borderRadius: "6px", fontWeight: 700, fontSize: "12px" }}>
                          {r.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: "#1e293b" }}>{r.count}</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: r.color }}>{r.share}</td>
                      <td style={{ padding: "12px", color: "#475569" }}>{r.act}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table VII */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                Table VII: Per-Class & Aggregate Test Performance (Held-Out 3,000 Examples)
              </h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Evaluated with Optuna Bayesian-tuned XGBoost and SMOTE minority oversampling. Notice the rare Critical class maintained an F1 of 0.91.
              </p>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px", textAlign: "left", color: "#475569" }}>Risk Class</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#475569" }}>Precision</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#475569" }}>Recall</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#475569" }}>F1 Score</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "#475569" }}>Test Support</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cls: "Low", p: "0.95", r: "0.96", f1: "0.95", sup: "1,240", color: "#059669" },
                    { cls: "Moderate", p: "0.91", r: "0.90", f1: "0.91", sup: "970", color: "#d97706" },
                    { cls: "High", p: "0.89", r: "0.88", f1: "0.88", sup: "580", color: "#ea580c" },
                    { cls: "Critical", p: "0.92", r: "0.90", f1: "0.91", sup: "210", color: "#dc2626" },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontWeight: 700, color: row.color }}>{row.cls}</td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: 600 }}>{row.p}</td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: 600 }}>{row.r}</td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: row.color }}>{row.f1}</td>
                      <td style={{ padding: "12px", textAlign: "right", color: "#64748b" }}>{row.sup}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "#f8fafc", borderTop: "2px solid #cbd5e1", fontWeight: 700 }}>
                    <td style={{ padding: "12px", color: "#0f172a" }}>Weighted Average</td>
                    <td style={{ padding: "12px", textAlign: "center", color: "#2563eb" }}>0.92</td>
                    <td style={{ padding: "12px", textAlign: "center", color: "#2563eb" }}>0.92</td>
                    <td style={{ padding: "12px", textAlign: "center", color: "#2563eb" }}>0.92</td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#2563eb" }}>3,000</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Award size={18} color="#2563eb" />
              <span style={{ fontSize: "13px", color: "#1e40af", fontWeight: 600 }}>
                Overall Accuracy: <b>92%</b> &nbsp;|&nbsp; Cohen's κ: <b>0.88</b> (surpasses the 0.80 threshold for "strong clinical agreement").
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BASELINES (Table VIII) */}
      {activeTab === "baselines" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
              Table VIII: Baseline Comparison on the Identical Test Split
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
              XGBoost achieves the highest accuracy and F1 score while delivering ultra-low 8.6ms latency (17x faster than LSTM).
            </p>

            {/* Recharts Bar Chart */}
            <div style={{ height: "300px", width: "100%", marginBottom: "24px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BASELINE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "#64748b" }} unit="%" />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    formatter={(val: any) => [`${val}%`, ""]}
                  />
                  <Bar dataKey="accuracy" name="Accuracy (%)" radius={[6, 6, 0, 0]}>
                    {BASELINE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isOurs ? "#2563eb" : "#94a3b8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px", textAlign: "left", color: "#475569" }}>Classifier</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#475569" }}>Accuracy</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#475569" }}>F1 (Weighted)</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#475569" }}>Cohen's κ</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "#475569" }}>Latency (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {BASELINE_DATA.map((b, i) => (
                    <tr key={i} style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: b.isOurs ? "#eff6ff" : "transparent"
                    }}>
                      <td style={{ padding: "12px", fontWeight: b.isOurs ? 800 : 500, color: b.isOurs ? "#1d4ed8" : "#1e293b" }}>
                        {b.name} {b.isOurs && "★"}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: b.isOurs ? 800 : 500, color: b.isOurs ? "#1d4ed8" : "#334155" }}>
                        {(b.accuracy / 100).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: b.isOurs ? 800 : 500, color: b.isOurs ? "#1d4ed8" : "#334155" }}>
                        {(b.f1 / 100).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: b.isOurs ? 800 : 500, color: b.isOurs ? "#1d4ed8" : "#334155" }}>
                        {(b.kappa / 100).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: b.isOurs ? 800 : 500, color: b.latency > 100 ? "#dc2626" : b.isOurs ? "#1d4ed8" : "#334155" }}>
                        {b.latency} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SHAP (Figure 4) */}
      {activeTab === "shap" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
                  Figure 4: Mean Absolute SHAP Contribution Per Feature
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                  Share of total predictive weight. PM2.5, its humidity interaction, and ozone carry over 50% of the model's reasoning.
                </p>
              </div>
              <span style={{
                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700
              }}>
                Interaction Features: 34.6% Weight
              </span>
            </div>

            {/* Horizontal Breakdown Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
              {SHAP_DATA.map((s, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "160px", textAlign: "right", fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                    {s.feature}
                  </div>
                  <div style={{ flex: 1, height: "24px", background: "#f1f5f9", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
                    <div style={{
                      width: `${(s.weight / 25) * 100}%`,
                      height: "100%",
                      background: s.fill,
                      borderRadius: "6px",
                      transition: "width 0.8s ease"
                    }} />
                  </div>
                  <div style={{ width: "55px", fontSize: "13px", fontWeight: 800, color: s.fill }}>
                    {s.weight}%
                  </div>
                  <span style={{
                    fontSize: "11px",
                    color: s.category.includes("Engineered") ? "#8b5cf6" : "#64748b",
                    background: s.category.includes("Engineered") ? "#f5f3ff" : "#f8fafc",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontWeight: 600,
                    width: "140px",
                    textAlign: "center"
                  }}>
                    {s.category}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "24px", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "13px", color: "#0f172a", marginBottom: "4px" }}>
                <Brain size={16} color="#8b5cf6" />
                Atmospheric & Clinical Justification
              </div>
              <p style={{ fontSize: "12px", color: "#475569", lineHeight: 1.6, margin: 0 }}>
                The three engineered interaction features (<code>humidity × PM2.5</code>, <code>oxidant burden</code>, <code>temp × PM10</code>) together account for roughly 35% of total predictive weight. This empirically proves that asthma risk is non-linear and heavily influenced by hygroscopic aerosol expansion and photochemical ozone-nitrogen co-production.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ABLATION (Table X & Fig 5) */}
      {activeTab === "ablation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
              Table X & Figure 5: Ablation Results (Impact of Removing Each Component)
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px 0" }}>
              Component-by-component evaluation showing drop in weighted F1 score when disabled. Feature engineering and missing value imputation account for the largest drops.
            </p>

            <div style={{ height: "260px", width: "100%", marginBottom: "24px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ABLATION_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="config" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} angle={-20} textAnchor="end" />
                  <YAxis domain={[0.7, 1.0]} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "none", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    formatter={(val: any) => [val, "Weighted F1"]}
                  />
                  <Bar dataKey="f1" radius={[6, 6, 0, 0]}>
                    {ABLATION_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px", textAlign: "left", color: "#475569" }}>Configuration</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#475569" }}>F1 (Weighted)</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#475569" }}>ΔF1 Impact</th>
                    <th style={{ padding: "12px", textAlign: "left", color: "#475569" }}>Systemic Role</th>
                  </tr>
                </thead>
                <tbody>
                  {ABLATION_DATA.map((a, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontWeight: i === 0 ? 800 : 500, color: i === 0 ? "#059669" : "#1e293b" }}>
                        {a.config}
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: 700 }}>{a.f1.toFixed(2)}</td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: a.delta === "—" ? "#059669" : "#dc2626" }}>
                        {a.delta}
                      </td>
                      <td style={{ padding: "12px", fontSize: "12px", color: "#64748b" }}>
                        {i === 0 ? "Production AirGuard system baseline" : i === 6 ? "Critical physiological interaction loss" : i === 5 ? "Sensor outage vulnerability" : "Preprocessing & regularizer"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PIPELINE & LATENCY (Table IX) */}
      {activeTab === "pipeline" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* 5-Stage Diagram */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 16px 0" }}>
              AirGuard 5-Stage Asynchronous Architecture (Figure 1 & 2)
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              {[
                { stage: "Layer 1: Acquisition", desc: "Parallel async fetch of 7 pollutants + 10-min TTL in-memory cache", tag: "134ms Cache Hit" },
                { stage: "Layer 2: Cleaning", desc: "5-sample rolling imputation, modified Z-score (MAD), 3 interaction features", tag: "10D Vector" },
                { stage: "Layer 3: XGBoost", desc: "Bayesian-tuned tree ensemble + SMOTE class balancing", tag: "8.6ms Inference" },
                { stage: "Layer 4: SHAP Explain", desc: "Local feature attribution engine + clinical guidance generation", tag: "Explainable AI" },
                { stage: "Layer 5: Alerts", desc: "Decoupled queue with Double Throttle (60-min cooldown + Critical override)", tag: "Email / WhatsApp" },
              ].map((st, i) => (
                <div key={i} style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  padding: "16px"
                }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>Stage {i + 1}</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", margin: "4px 0" }}>{st.stage}</div>
                  <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.4, margin: "0 0 10px 0" }}>{st.desc}</p>
                  <span style={{ fontSize: "11px", background: "#eff6ff", color: "#1d4ed8", padding: "3px 8px", borderRadius: "4px", fontWeight: 600 }}>
                    {st.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Table IX: Latency */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: "0 0 4px 0" }}>
              Table IX: End-to-End Response Time by Cache State
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
              In-memory cache delivers a 72% production hit rate, keeping median user latency under 135ms.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px", textAlign: "left", color: "#475569" }}>Percentile</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#475569" }}>Cache Miss Latency (ms)</th>
                    <th style={{ padding: "12px", textAlign: "center", color: "#475569" }}>Cache Hit Latency (ms)</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "#475569" }}>Speedup Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  {LATENCY_DATA.map((l, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>{l.percentile}</td>
                      <td style={{ padding: "12px", textAlign: "center", color: "#64748b" }}>{l.miss} ms</td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: "#059669" }}>{l.hit} ms</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#2563eb" }}>
                        {(l.miss / l.hit).toFixed(1)}x faster
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
