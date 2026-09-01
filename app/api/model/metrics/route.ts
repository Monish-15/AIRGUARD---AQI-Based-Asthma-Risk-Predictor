import { NextResponse } from "next/server";

export async function GET() {
  // Try proxying to FastAPI if available
  try {
    const backendUrl = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${backendUrl}/api/model/metrics`, { signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {}

  // Fallback to exact data reported in the conference paper
  const paperMetrics = {
    paper_title: "AirGuard: An Explainable AI-Based Asthma Risk Prediction and Alert System",
    authors: ["Monish Ram", "Dr. J. Cynthia"],
    institution: "Karunya Institute of Technology and Sciences, Coimbatore, Tamil Nadu, India",
    dataset_summary: {
      total_records: 15000,
      cities: ["Chennai", "Delhi", "Mumbai", "Bengaluru", "Hyderabad"],
      timespan: "January 2021 – December 2023",
      stratification: "80/20 train/test split (12,000 train / 3,000 test)",
      expert_panel: "3-pulmonologist panel using WHO AQI breakpoints + epidemiological guidance (kappa = 0.84)",
    },
    table_vi_distribution: [
      { risk_class: "Low", count: 6200, share: "41.3%", guidance: "Normal outdoor activity" },
      { risk_class: "Moderate", count: 4850, share: "32.3%", guidance: "Reduce strenuous outdoor exertion, monitor symptoms" },
      { risk_class: "High", count: 2900, share: "19.3%", guidance: "Stay indoors, keep rescue inhaler at hand, alert dispatched" },
      { risk_class: "Critical", count: 1050, share: "7.0%", guidance: "Remain indoors, seal windows, seek medical advice, urgent alert dispatched" },
    ],
    table_vii_test_performance: {
      per_class: [
        { risk_class: "Low", precision: 0.95, recall: 0.96, f1: 0.95, support: 1240 },
        { risk_class: "Moderate", precision: 0.91, recall: 0.90, f1: 0.91, support: 970 },
        { risk_class: "High", precision: 0.89, recall: 0.88, f1: 0.88, support: 580 },
        { risk_class: "Critical", precision: 0.92, recall: 0.90, f1: 0.91, support: 210 },
      ],
      overall_accuracy: 0.92,
      weighted_f1: 0.92,
      macro_f1: 0.91,
      cohen_kappa: 0.88,
    },
    table_viii_baselines: {
      "Logistic Regression": { acc: 0.74, f1_w: 0.72, kappa: 0.61, latency_ms: 1.2 },
      "Decision Tree": { acc: 0.81, f1_w: 0.79, kappa: 0.71, latency_ms: 0.8 },
      "Random Forest": { acc: 0.87, f1_w: 0.86, kappa: 0.81, latency_ms: 18.4 },
      "SVM (RBF)": { acc: 0.83, f1_w: 0.81, kappa: 0.75, latency_ms: 32.7 },
      "LSTM": { acc: 0.89, f1_w: 0.88, kappa: 0.83, latency_ms: 145.3 },
      "XGBoost (ours)": { acc: 0.92, f1_w: 0.92, kappa: 0.88, latency_ms: 8.6 },
    },
    table_ix_latency: [
      { percentile: "P50", cache_miss_ms: 312, cache_hit_ms: 134 },
      { percentile: "P75", cache_miss_ms: 401, cache_hit_ms: 178 },
      { percentile: "P90", cache_miss_ms: 487, cache_hit_ms: 221 },
      { percentile: "P95", cache_miss_ms: 614, cache_hit_ms: 259 },
      { percentile: "P99", cache_miss_ms: 892, cache_hit_ms: 318 },
    ],
    table_x_ablation: [
      { configuration: "Full AirGuard system", f1: 0.92, delta_f1: 0.0, description: "All 5 layers, 10D features, SMOTE, MAD outlier clipping" },
      { configuration: "w/o feature engineering", f1: 0.84, delta_f1: -0.08, description: "Only 7 raw features; interaction features disabled" },
      { configuration: "w/o missing value imputation", f1: 0.86, delta_f1: -0.06, description: "Raw missing values dropped or zeroed" },
      { configuration: "w/o SMOTE oversampling", f1: 0.88, delta_f1: -0.04, description: "Standard training without synthetic minority balancing" },
      { configuration: "w/o outlier correction", f1: 0.90, delta_f1: -0.02, description: "No modified Z-score or MAD boundary clipping" },
      { configuration: "w/o L2 regularization", f1: 0.89, delta_f1: -0.03, description: "Tree boosting without L2 leaf regularization" },
      { configuration: "w/o min-max normalization", f1: 0.91, delta_f1: -0.01, description: "Unscaled feature inputs fed directly" },
      { configuration: "Raw features, no preprocessing", f1: 0.79, delta_f1: -0.13, description: "Baseline raw telemetry without pipeline steps" },
    ],
    figure_4_shap_weights: [
      { feature: "PM2.5", weight_pct: 24.1, is_interaction: false, note: "Deep alveolar penetration & inflammation" },
      { feature: "PM2.5 × Humidity", weight_pct: 17.6, is_interaction: true, note: "Hygroscopic moisture uptake & lung deposition" },
      { feature: "O3", weight_pct: 14.5, is_interaction: false, note: "Bronchospasm & acute oxidative irritation" },
      { feature: "Oxidant burden", weight_pct: 11.1, is_interaction: true, note: "Synergistic photochemical co-production" },
      { feature: "NO2", weight_pct: 9.1, is_interaction: false, note: "Airway hyper-responsiveness" },
      { feature: "Humidity", weight_pct: 7.5, is_interaction: false, note: "Mold growth & particulate swelling" },
      { feature: "Temp × PM10", weight_pct: 5.9, is_interaction: true, note: "Heat stress & secondary aerosol production" },
      { feature: "PM10", weight_pct: 4.9, is_interaction: false, note: "Upper airway mucosal irritation" },
      { feature: "Temperature", weight_pct: 3.7, is_interaction: false, note: "Cold bronchoconstriction / thermal trigger" },
      { feature: "CO", weight_pct: 1.6, is_interaction: false, note: "Oxygen displacement in blood" },
    ],
    interaction_features_total_share_pct: 34.6,
  };

  return NextResponse.json(paperMetrics);
}
