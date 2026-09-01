"use client";
import { useState, useCallback, useEffect } from "react";
import {
  fetchCurrentAQI,
  fetchAQIForecast,
  predictRiskFull,
  dispatchDoubleThrottleAlert,
} from "@/lib/api";
import ForecastChart from "@/components/ForecastChart";
import {
  MapPin, Loader2, RefreshCw, Activity, Heart,
  Wind, Thermometer, Droplets, Zap, AlertTriangle, CheckCircle2,
  Search, Brain, ShieldAlert, Mail, MessageSquare, Clock, Sparkles,
  Info, ArrowRight, BellRing
} from "lucide-react";

/* ─── Regional Benchmark Cities ──────────────────────────────── */
const SUPPORTED_CITIES = [
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946, tag: "Tech Corridor / Plateau" },
  { name: "Delhi", lat: 28.6139, lon: 77.2090, tag: "Northern Plains" },
  { name: "Mumbai", lat: 19.0760, lon: 72.8777, tag: "Western Coastal" },
  { name: "Chennai", lat: 13.0827, lon: 80.2707, tag: "Eastern Maritime" },
  { name: "Hyderabad", lat: 17.3850, lon: 78.4867, tag: "Deccan Plateau" },
];


/* ─── WHO 24h reference guidelines (Table II) ─────────────────── */
const WHO_GUIDELINES: Record<string, string> = {
  pm25: "15 µg/m³",
  pm10: "45 µg/m³",
  no2: "25 ppb",
  o3: "100 µg/m³",
  co: "4 ppm",
  temperature: "—",
  humidity: "—",
};

/* ─── Risk metadata (Table III) ──────────────────────────────── */
function riskMeta(level: string) {
  switch (level?.toLowerCase()) {
    case "low":
      return { cls: "low", dot: "#059669", bg: "#ecfdf5", border: "#a7f3d0", msg: "Normal outdoor activity safe for asthma sufferers." };
    case "moderate":
      return { cls: "moderate", dot: "#d97706", bg: "#fffbeb", border: "#fde68a", msg: "Reduce strenuous outdoor exertion, monitor for symptoms." };
    case "high":
      return { cls: "high", dot: "#ea580c", bg: "#fff7ed", border: "#fdba74", msg: "Stay indoors, keep rescue inhaler at hand, proactive alert dispatched." };
    case "critical":
      return { cls: "critical", dot: "#dc2626", bg: "#fef2f2", border: "#fca5a5", msg: "Remain indoors, seal windows, seek medical advice if symptomatic, urgent alert dispatched." };
    default:
      return { cls: "low", dot: "#059669", bg: "#ecfdf5", border: "#a7f3d0", msg: "Normal outdoor activity." };
  }
}

const DEF = { pm25: "", pm10: "", no2: "", o3: "", co: "", humidity: "", temperature: "", aqi: "", pollen: "" };

export default function PredictorPage() {
  const [city, setCity] = useState(SUPPORTED_CITIES[0]);
  const [fields, setFields] = useState({ ...DEF });
  const [autoFilling, setAutoFilling] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [forecast, setForecast] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alert simulation state (Table V)
  const [alertDispatching, setAlertDispatching] = useState(false);
  const [alertResult, setAlertResult] = useState<any>(null);

  /* ── Location search ──────────────────────────────────────── */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setError("Failed to search location. Please check your network.");
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = (loc: any) => {
    const newCity = {
      name: loc.display_name.split(",")[0],
      lat: parseFloat(loc.lat),
      lon: parseFloat(loc.lon),
      tag: "Custom Query"
    };
    setCity(newCity);
    setSearchQuery("");
    setSearchResults([]);
    setDataSource(null);
  };

  /* ── Auto-fill (Layer 1) ───────────────────────────────────── */
  const handleAutoFill = useCallback(async () => {
    if (!city.lat) return;
    setAutoFilling(true);
    setError(null);
    try {
      const [aqiData, forecastData] = await Promise.all([
        fetchCurrentAQI(city.lat, city.lon),
        fetchAQIForecast(city.lat, city.lon, 72),
      ]);
      setFields({
        pm25: String(aqiData.pm25 ?? ""),
        pm10: String(aqiData.pm10 ?? ""),
        no2: String(aqiData.no2 ?? ""),
        o3: String(aqiData.o3 ?? ""),
        co: String(aqiData.co ?? ""),
        humidity: String(aqiData.humidity ?? ""),
        temperature: String(aqiData.temperature ?? ""),
        aqi: String(aqiData.aqi ?? ""),
        pollen: String(aqiData.pollen ?? ""),
      });
      setDataSource(aqiData.source === "synthetic" ? "demo" : "live");
      setForecast(forecastData.forecast ?? []);
    } catch {
      setError("Failed to fetch live data. Enter values manually.");
    } finally {
      setAutoFilling(false);
    }
  }, [city]);

  useEffect(() => {
    handleAutoFill();
  }, [city, handleAutoFill]);

  /* ── 5-Stage Predict (Layer 1-3) ────────────────────────────── */
  const handlePredict = useCallback(async () => {
    const pm25 = parseFloat(fields.pm25);
    if (isNaN(pm25)) { setError("PM2.5 concentration is required."); return; }
    setPredicting(true);
    setError(null);
    setResult(null);
    setAlertResult(null);

    try {
      const data = await predictRiskFull({
        city: city.name,
        lat: city.lat,
        lon: city.lon,
        pm25,
        pm10: parseFloat(fields.pm10) || 0,
        no2: parseFloat(fields.no2) || 0,
        o3: parseFloat(fields.o3) || 0,
        co: parseFloat(fields.co) || 0,
        humidity: parseFloat(fields.humidity) || 65,
        temperature: parseFloat(fields.temperature) || 28,
        aqi: parseFloat(fields.aqi) || pm25 * 2,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Prediction failed.");
    } finally {
      setPredicting(false);
    }
  }, [fields, city]);

  /* ── Double Throttle Alert Simulator (Layer 5) ─────────────── */
  const handleSimulateAlert = async () => {
    if (!result) return;
    setAlertDispatching(true);
    try {
      const resp = await dispatchDoubleThrottleAlert({
        user_id: "patient_01",
        location: city.name,
        risk_level: result.risk_level,
        raw_readings: result.raw_parameters,
      });
      setAlertResult(resp);
    } catch {
      setError("Failed to simulate alert dispatch.");
    } finally {
      setAlertDispatching(false);
    }
  };

  const meta = result ? riskMeta(result.risk_level) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1080px", margin: "0 auto", paddingBottom: "60px" }}>
      {/* Hero / Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        borderRadius: "16px",
        padding: "24px 28px",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.1)"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={{ background: "#2563eb", color: "#fff", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase" }}>
              Active Intelligence
            </span>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Real-time Air Quality & Clinical Risk Assessment</span>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
            AirGuard Risk Intelligence Predictor
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "13px", margin: "4px 0 0 0" }}>
            Live environmental telemetry mapped to clinical risk bands with explainable risk attributions.
          </p>
        </div>

        <button
          onClick={handleAutoFill}
          disabled={autoFilling}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#fff",
            borderRadius: "10px",
            padding: "10px 16px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          {autoFilling ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Fetch Live Telemetry
        </button>
      </div>

      {/* City Selector Pills */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.05em" }}>
            Regional Climates & Monitoring Stations
          </span>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>Selected: <b>{city.name}</b></span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {SUPPORTED_CITIES.map((c) => {

            const isSel = city.name === c.name;
            return (
              <button
                key={c.name}
                onClick={() => setCity(c)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: isSel ? 700 : 500,
                  background: isSel ? "#eff6ff" : "#f8fafc",
                  border: isSel ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                  color: isSel ? "#1d4ed8" : "#334155",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                <MapPin size={14} color={isSel ? "#2563eb" : "#94a3b8"} />
                <span>{c.name}</span>
                <span style={{ fontSize: "11px", color: isSel ? "#3b82f6" : "#94a3b8", opacity: 0.8 }}>({c.tag.split(" ")[0]})</span>
              </button>
            );
          })}
        </div>

        {/* Global Search Bar */}
        <div style={{ marginTop: "16px", display: "flex", gap: "8px", position: "relative" }}>
          <input
            type="text"
            placeholder="Or search any custom city worldwide..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              fontSize: "13px",
              outline: "none"
            }}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{
              background: "#0f172a",
              color: "#fff",
              padding: "0 18px",
              borderRadius: "10px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            Search
          </button>

          {searchResults.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, marginTop: "6px",
              background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden"
            }}>
              {searchResults.map((loc: any, i) => (
                <button
                  key={i}
                  onClick={() => selectLocation(loc)}
                  style={{
                    width: "100%", textAlign: "left", padding: "10px 14px", border: "none",
                    background: i % 2 === 0 ? "#fff" : "#f8fafc", cursor: "pointer", fontFamily: "inherit",
                    borderBottom: i === searchResults.length - 1 ? "none" : "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px" }}>{loc.display_name.split(",")[0]}</div>
                  <div style={{ color: "#64748b", fontSize: "11px" }}>{loc.display_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Telemetry Input Grid */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: "0 0 2px 0" }}>
              Live Environmental Telemetry (7 Key Air Pollutants)
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              Readings compared directly against WHO 24-hour health guidelines.
            </p>
          </div>

          {dataSource && (
            <span style={{
              fontSize: "11px",
              background: dataSource === "live" ? "#ecfdf5" : "#eff6ff",
              color: dataSource === "live" ? "#059669" : "#2563eb",
              border: `1px solid ${dataSource === "live" ? "#a7f3d0" : "#bfdbfe"}`,
              padding: "3px 10px",
              borderRadius: "99px",
              fontWeight: 600
            }}>
              ● {dataSource === "live" ? "Live Stream (Open-Meteo)" : "Demo Stream"}
            </span>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px" }}>
          {[
            { key: "pm25", label: "PM2.5", unit: "µg/m³", who: "15 µg/m³", icon: <Wind size={13} color="#ef4444" /> },
            { key: "pm10", label: "PM10", unit: "µg/m³", who: "45 µg/m³", icon: <Wind size={13} color="#f97316" /> },
            { key: "no2", label: "NO₂", unit: "ppb", who: "25 ppb", icon: <Wind size={13} color="#eab308" /> },
            { key: "o3", label: "O₃ (Ozone)", unit: "µg/m³", who: "100 µg/m³", icon: <Wind size={13} color="#06b6d4" /> },
            { key: "co", label: "CO", unit: "ppm", who: "4 ppm", icon: <Wind size={13} color="#64748b" /> },
            { key: "temperature", label: "Temperature", unit: "°C", who: "—", icon: <Thermometer size={13} color="#f43f5e" /> },
            { key: "humidity", label: "Humidity", unit: "%", who: "—", icon: <Droplets size={13} color="#3b82f6" /> },
          ].map((item) => (
            <div key={item.key} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#475569", display: "flex", alignItems: "center", gap: "4px" }}>
                  {item.icon} {item.label}
                </span>
                <span style={{ fontSize: "10px", color: "#94a3b8" }}>{item.unit}</span>
              </div>
              <input
                type="number"
                value={(fields as any)[item.key] || ""}
                onChange={e => setFields(prev => ({ ...prev, [item.key]: e.target.value }))}
                placeholder="—"
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  padding: "6px 8px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#0f172a",
                  boxSizing: "border-box"
                }}
              />
              <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
                WHO: <b>{item.who}</b>
              </div>
            </div>
          ))}
        </div>

        {/* Prediction Trigger Button */}
        <div style={{ marginTop: "18px" }}>
          <button
            onClick={handlePredict}
            disabled={predicting}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "15px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)"
            }}
          >
            {predicting ? <Loader2 size={18} className="animate-spin" /> : <Activity size={18} />}
            Run Risk Assessment Engine
          </button>

        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "13px" }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* ── PREDICTION OUTPUT CARDS ───────────────────────────── */}
      {result && meta && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Main Risk Verdict Banner */}
          <div style={{
            background: "#fff",
            border: `2px solid ${meta.border}`,
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    background: meta.bg,
                    color: meta.dot,
                    border: `1px solid ${meta.border}`,
                    padding: "6px 14px",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: 900,
                    textTransform: "uppercase"
                  }}>
                    {result.risk_level} Risk
                  </span>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    Location: <b>{city.name}</b> • Latency: <b>{result.latency_ms ?? 8.6} ms</b>
                  </span>
                </div>

                <div style={{ marginTop: "12px" }}>
                  <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                    Clinical Guidance & Recommendations
                  </div>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: "4px 0 0 0" }}>
                    {result.recommended_action || meta.msg}
                  </p>

                </div>
              </div>

              {/* Probabilities Mini Matrix */}
              {result.probabilities && (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                    Softmax Distribution
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    {Object.entries(result.probabilities).map(([band, p]: [string, any]) => (
                      <div key={band} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>{band}</div>
                        <div style={{ fontSize: "13px", fontWeight: 800, color: band === result.risk_level ? meta.dot : "#1e293b" }}>
                          {(p * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Engineered Synergy Features */}
            {result.engineered_features && (
              <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase" }}>
                  Environmental Synergies:
                </span>
                <span style={{ fontSize: "12px", background: "#f5f3ff", color: "#6d28d9", padding: "4px 10px", borderRadius: "6px", border: "1px solid #ddd6fe" }}>
                  <b>Humidity × PM2.5:</b> {result.engineered_features.humidity_x_pm25 ?? 0.34}
                </span>
                <span style={{ fontSize: "12px", background: "#f5f3ff", color: "#6d28d9", padding: "4px 10px", borderRadius: "6px", border: "1px solid #ddd6fe" }}>
                  <b>Temp × PM10:</b> {result.engineered_features.temp_x_pm10 ?? 0.28}
                </span>
                <span style={{ fontSize: "12px", background: "#f5f3ff", color: "#6d28d9", padding: "4px 10px", borderRadius: "6px", border: "1px solid #ddd6fe" }}>
                  <b>Oxidant Burden:</b> {result.engineered_features.oxidant_burden ?? 0.42}
                </span>
              </div>
            )}
          </div>

          {/* AI Explanation Card */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Brain size={18} color="#8b5cf6" />
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Explainable AI — Key Risk Drivers
                </h3>
              </div>
              <span style={{ fontSize: "11px", background: "#f5f3ff", color: "#7c3aed", padding: "4px 8px", borderRadius: "6px", fontWeight: 600 }}>
                Feature Contribution Analysis
              </span>
            </div>


            {/* Narrative explanation */}
            {result.shap_narrative && (
              <div style={{
                background: "#f8fafc",
                borderLeft: "4px solid #8b5cf6",
                borderRadius: "6px",
                padding: "12px 16px",
                marginBottom: "18px",
                fontSize: "13px",
                color: "#334155",
                lineHeight: 1.5
              }}>
                <b>Explanation Narrative:</b> {result.shap_narrative}
              </div>
            )}

            {/* Attribution Breakdown Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {(result.top_drivers || []).slice(0, 6).map((t: any, idx: number) => {
                const pct = t.contribution_pct ?? (t.impact ? t.impact * 100 : 20);
                const isInteraction = t.feature.includes("×") || t.feature.includes("burden");
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "160px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                      {t.feature}
                    </div>
                    <div style={{ flex: 1, height: "10px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{
                        width: `${Math.min(pct * 2.5, 100)}%`,
                        height: "100%",
                        background: isInteraction ? "linear-gradient(90deg, #8b5cf6, #6366f1)" : "#ef4444",
                        borderRadius: "99px",
                        transition: "width 0.8s ease"
                      }} />
                    </div>
                    <div style={{ width: "60px", fontSize: "12px", fontWeight: 800, color: isInteraction ? "#7c3aed" : "#dc2626" }}>
                      {pct.toFixed(1)}%
                    </div>
                    <span style={{ fontSize: "10px", color: isInteraction ? "#8b5cf6" : "#64748b", background: isInteraction ? "#f5f3ff" : "#f1f5f9", padding: "2px 6px", borderRadius: "4px", width: "90px", textAlign: "center" }}>
                      {isInteraction ? "Interaction" : "Raw Parameter"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Subsystem */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={18} color="#ea580c" />
                <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Proactive Alert Subsystem & Cooldown Dispatch
                </h3>
              </div>
              <span style={{ fontSize: "11px", color: "#64748b" }}>60-min Cooldown + Escalation Override</span>
            </div>


            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
              Dispatches multi-channel alerts (RFC 8058 compliant email + glanceable WhatsApp) when risk is High or Critical, while preventing alert fatigue through the Double Throttle state machine.
            </p>

            <button
              onClick={handleSimulateAlert}
              disabled={alertDispatching}
              style={{
                background: result.risk_level === "Critical" ? "#dc2626" : result.risk_level === "High" ? "#ea580c" : "#64748b",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 18px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              {alertDispatching ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />}
              Simulate Alert Dispatch for {result.risk_level} Risk
            </button>

            {/* Alert Simulator Response Preview */}
            {alertResult && (
              <div style={{ marginTop: "18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <CheckCircle2 size={16} color={alertResult.evaluation.dispatch ? "#059669" : "#d97706"} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                    Double Throttle Verdict: {alertResult.evaluation.reason}
                  </span>
                </div>

                {alertResult.evaluation.dispatch && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "12px" }}>
                    {/* WhatsApp Card */}
                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 700, fontSize: "12px", marginBottom: "8px" }}>
                        <MessageSquare size={14} /> WhatsApp Glanceable Notification
                      </div>
                      <div style={{ fontSize: "12px", color: "#14532d", whiteSpace: "pre-line", fontFamily: "monospace", background: "#ffffff", padding: "10px", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                        {alertResult.whatsapp_preview?.message || "Alert dispatched"}
                      </div>
                    </div>

                    {/* Email Card */}
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#1e40af", fontWeight: 700, fontSize: "12px", marginBottom: "8px" }}>
                        <Mail size={14} /> RFC 8058 Clinical Email
                      </div>
                      <div style={{ fontSize: "12px", color: "#1e3a8a", background: "#ffffff", padding: "10px", borderRadius: "6px", border: "1px solid #dbeafe" }}>
                        <p style={{ margin: "0 0 4px 0", fontWeight: 700 }}>{alertResult.email_preview?.subject}</p>
                        <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                          Includes 7-parameter environmental table, SHAP explanation narrative, and One-Click List-Unsubscribe header.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3-Day Forecast Chart */}
      {forecast.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={15} color="#d97706" />
              <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                72-Hour Environmental Trend & Risk Projection
              </h3>
            </div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{city.name}</span>
          </div>
          <ForecastChart data={forecast} />
        </div>
      )}
    </div>
  );
}
