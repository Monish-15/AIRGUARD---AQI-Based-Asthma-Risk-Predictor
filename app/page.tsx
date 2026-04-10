"use client";
import { useState, useCallback, useEffect } from "react";
import {
  fetchCurrentAQI,
  fetchAQIForecast,
  predictRiskWithWearable,
} from "@/lib/api";
import ForecastChart from "@/components/ForecastChart";
import {
  MapPin, Loader2, RefreshCw, Activity, Heart,
  Wind, Thermometer, Droplets, Zap, AlertTriangle, CheckCircle2,
  Search,
} from "lucide-react";

/* ─── Risk metadata ─────────────────────────────────────────── */
function riskMeta(level: string) {
  switch (level?.toLowerCase()) {
    case "low":      return { cls: "low",      dot: "#059669", msg: "Air quality is safe. No restrictions needed." };
    case "moderate": return { cls: "moderate", dot: "#d97706", msg: "Moderate risk — limit prolonged outdoor exposure." };
    case "high":     return { cls: "high",     dot: "#ea580c", msg: "High risk — avoid outdoor activity. Carry your inhaler." };
    case "critical": return { cls: "critical", dot: "#dc2626", msg: "Critical — stay indoors. Seek medical advice if symptomatic." };
    default:         return { cls: "low",      dot: "#059669", msg: "" };
  }
}

const DEF = { pm25: "", pm10: "", no2: "", o3: "", co: "", humidity: "", temperature: "", aqi: "", pollen: "" };

/* ─── Divider ────────────────────────────────────────────────── */
const Divider = () => (
  <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }} />
);

/* ─── Section header ─────────────────────────────────────────── */
function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {icon}
        <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>{title}</span>
        {sub && <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "2px" }}>{sub}</span>}
      </div>
    </div>
  );
}

export default function PredictorPage() {
  const [city, setCity] = useState({ name: "Bengaluru", lat: 12.9716, lon: 77.5946 });
  const [fields, setFields] = useState({ ...DEF });
  const [autoFilling, setAutoFilling] = useState(false);
  const [dataSource, setDataSource] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedCity");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.name) setCity(parsed);
        } catch (e) {}
      }
    }
  }, []);



  const [forecast, setForecast] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    };
    setCity(newCity);
    setSearchQuery("");
    setSearchResults([]);
    setDataSource(null);
    setFields({ ...DEF });
  };

  /* ── Auto-fill ──────────────────────────────────────────────── */
  const handleAutoFill = useCallback(async () => {
    if (city.lat === 0) return;
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
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCity", JSON.stringify(city));
    }
    if (city.lat !== 0) {
      handleAutoFill();
    }
  }, [city, handleAutoFill]);

  /* ── Predict ─────────────────────────────────────────────────── */
  const handlePredict = useCallback(async () => {
    const pm25 = parseFloat(fields.pm25);
    if (isNaN(pm25)) { setError("PM2.5 is required."); return; }
    setPredicting(true);
    setError(null);
    setResult(null);
    try {
      const data = await predictRiskWithWearable({
        pm25,
        pm10: parseFloat(fields.pm10) || 0,
        no2: parseFloat(fields.no2) || 0,
        o3: parseFloat(fields.o3) || 0,
        co: parseFloat(fields.co) || 0,
        humidity: parseFloat(fields.humidity) || 65,
        temperature: parseFloat(fields.temperature) || 28,
        aqi: parseFloat(fields.aqi) || pm25 * 2,
        pollen: parseFloat(fields.pollen) || 0,
        asthma_severity: 1,
        heart_rate: null,
        spo2: null,
        breathing_rate: null,
      });
      setResult(data);
      if (forecast.length === 0 && city.lat !== 0) {
        const fd = await fetchAQIForecast(city.lat, city.lon, 72);
        setForecast(fd.forecast ?? []);
      }
    } catch {
      setError("Prediction failed. Make sure the backend is running.");
    } finally {
      setPredicting(false);
    }
  }, [fields, forecast, city]);

  const meta = result ? riskMeta(result.risk_level) : null;

  /* ─── shared text colours ─────────────────────────────────── */
  const T = { primary: "#0f172a", secondary: "#334155", muted: "#94a3b8", border: "#e2e8f0" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "60px" }}>

      {/* ── HEADER ────────────────────────────────────────────── */}

      <div className="animate-in" style={{ textAlign: "center", paddingTop: "4px", paddingBottom: "4px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, color: T.primary, letterSpacing: "-0.02em" }}>
          Asthma Risk Predictor
        </h1>
        <p style={{ color: T.muted, fontSize: "13px", marginTop: "5px" }}>
          Enter air quality data and optional wearable readings to assess your personal risk.
        </p>
      </div>

      {/* ── LOCATION + AQI ────────────────────────────────────── */}
      <div className="section-card animate-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <SectionHeader
            icon={<MapPin size={14} style={{ color: "#2563eb" }} />}
            title="Location & Air Quality"
          />
          <button
            id="autofill-btn"
            className="autofill-btn"
            onClick={handleAutoFill}
            disabled={autoFilling || city.lat === 0}
          >
            {autoFilling
              ? <><Loader2 size={11} className="animate-spin" /> Fetching…</>
              : <><RefreshCw size={11} /> Auto-fill from API</>}
          </button>
        </div>

        {/* Global city search */}
        <div style={{ marginBottom: "18px", position: "relative" }}>
          <label className="input-label" htmlFor="city-search">Search Any Global Location</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              id="city-search"
              type="text"
              className="input-field"
              placeholder="e.g., London, Tokyo, New York"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              style={{ flex: 1 }}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              style={{
                background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", gap: "6px",
                padding: "0 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                border: "none", transition: "background 0.2s"
              }}
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </div>
          
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
                    width: "100%", textAlign: "left", padding: "12px 14px", border: "none",
                    background: i % 2 === 0 ? "#fff" : "#f8fafc", cursor: "pointer", fontFamily: "inherit",
                    borderBottom: i === searchResults.length - 1 ? "none" : "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>
                    {loc.display_name.split(",")[0]}
                  </div>
                  <div style={{ color: "#64748b", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {loc.display_name}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
            <span style={{ color: "#64748b" }}>Currently selected:</span>
            <span style={{ fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "4px" }}>
              <MapPin size={12} color="#2563eb" /> {city.name}
            </span>
          </div>
        </div>

        {/* Source pill */}
        {dataSource && (
          <div style={{ marginBottom: "12px" }}>
            <span className="badge" style={dataSource === "live"
              ? { background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0" }
              : { background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }
            }>
              {dataSource === "live" ? "● Live Data Stream" : "● Demo Data"}
            </span>
          </div>
        )}

        {/* Pollen Alert Feature Card */}
        {fields.pollen && Number(fields.pollen) > 300 && (
          <div className="animate-in" style={{
            background: "#fff7ed", border: "1px solid #fdba74", borderRadius: "12px",
            padding: "16px", marginBottom: "20px", display: "flex", alignItems: "flex-start", gap: "12px"
          }}>
            <span style={{ fontSize: "20px" }}>🌲</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#9a3412" }}>High Pollen Alert</div>
              <div style={{ fontSize: "13px", color: "#c2410c", marginTop: "2px" }}>
                Pollen levels are currently <b>{fields.pollen} grains/m³</b>. Even if AQI is good, stay alert for allergic triggers.
              </div>
            </div>
          </div>
        )}

        {/* AQI grid */}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {[
            { id: "inp-pm25", label: "PM2.5 (μg/m³) *", key: "pm25", icon: <Wind size={11} /> },
            { id: "inp-pm10", label: "PM10 (μg/m³)",    key: "pm10", icon: <Wind size={11} /> },
            { id: "inp-temp", label: "Temperature (°C)", key: "temperature", icon: <Thermometer size={11} /> },
            { id: "inp-hum",  label: "Humidity (%)",     key: "humidity",    icon: <Droplets size={11} /> },
            { id: "inp-aqi",  label: "AQI",              key: "aqi",         icon: <Zap size={11} /> },
            { id: "inp-pollen", label: "Pollen (grains/m³)", key: "pollen",    icon: <Wind size={11} /> },
            { id: "inp-no2",  label: "NO₂ (ppb)",        key: "no2",         icon: <Wind size={11} /> },
          ].map(({ id, label, key, icon }) => (
            <div key={key}>
              <label className="input-label" htmlFor={id}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: T.muted }}>
                  {icon} {label}
                </span>
              </label>
              <input
                id={id}
                type="number"
                className="input-field"
                placeholder="—"
                value={(fields as any)[key] || ""}
                onChange={e => setFields(prev => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>



      {/* ── ERROR ─────────────────────────────────────────────── */}
      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: "9px",
          padding: "11px 15px", borderRadius: "10px",
          background: "#fef2f2", border: "1px solid #fca5a5",
        }}>
          <AlertTriangle size={15} style={{ color: "#dc2626", flexShrink: 0 }} />
          <span style={{ color: "#dc2626", fontSize: "13px" }}>{error}</span>
        </div>
      )}

      {/* ── PREDICT BUTTON ────────────────────────────────────── */}
      <button id="predict-btn" className="predict-btn" onClick={handlePredict} disabled={predicting}>
        {predicting
          ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Loader2 size={16} className="animate-spin" /> Analysing…
            </span>
          : <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Activity size={16} /> Predict Asthma Risk
            </span>}
      </button>

      {/* ── OUTPUT ────────────────────────────────────────────── */}
      {result && meta && (
        <div className="section-card scale-in" style={{ textAlign: "center" }}>
          {/* Badge */}
          <div style={{ marginBottom: "12px" }}>
            <span className={`risk-badge ${meta.cls}`} id="risk-level-badge">
              {result.risk_level}
            </span>
          </div>

          {/* Score */}
          <div id="risk-score-value" style={{
            fontSize: "52px", fontWeight: 900, color: meta.dot, lineHeight: 1,
          }}>
            {result.risk_percent?.toFixed(1)}%
          </div>
          <div style={{ color: T.muted, fontSize: "12px", marginTop: "4px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Risk Score
          </div>

          <Divider />

          {/* Advisory */}
          <p style={{ color: T.secondary, fontSize: "14px", margin: "12px 0 0 0", lineHeight: 1.6 }}>
            {meta.msg}
          </p>



          {/* SHAP triggers */}
          {result.top_triggers?.length > 0 && (
            <div style={{ marginTop: "20px", textAlign: "left", borderTop: `1px solid ${T.border}`, paddingTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                <Zap size={13} style={{ color: "#d97706" }} />
                <span style={{ color: T.secondary, fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Contributing Factors
                </span>
              </div>
              {result.top_triggers.slice(0, 5).map((t: any, i: number) => {
                const pct = Math.min(Math.abs(t.impact) * 400, 100);
                const isUp = t.direction === "increase";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ width: "120px", textAlign: "right", color: T.muted, fontSize: "12px", flexShrink: 0 }}>
                      {t.feature.replace(/_/g, " ")}
                    </div>
                    <div style={{ flex: 1, height: "5px", borderRadius: "99px", background: "#f1f5f9" }}>
                      <div style={{
                        height: "5px", borderRadius: "99px", width: `${pct}%`,
                        background: isUp ? "#ef4444" : "#10b981",
                        transition: "width 0.8s ease",
                      }} />
                    </div>
                    <div style={{ width: "48px", fontSize: "11px", color: isUp ? "#dc2626" : "#059669", flexShrink: 0, textAlign: "right" }}>
                      {isUp ? "▲" : "▼"} {(Math.abs(t.impact) * 100).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 24H CHART ─────────────────────────────────────────── */}
      {forecast.length > 0 && (
        <div className="section-card animate-in">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Zap size={13} style={{ color: "#d97706" }} />
            <span style={{ fontWeight: 700, fontSize: "14px", color: T.primary }}>3-Day AQI Trend</span>
            {city.lat !== 0 && (
              <span style={{ marginLeft: "auto", color: T.muted, fontSize: "11px", display: "flex", alignItems: "center", gap: "3px" }}>
                <MapPin size={11} />{city.name}
              </span>
            )}
          </div>
          <ForecastChart data={forecast} />
        </div>
      )}

      {/* ── 3-DAY OUTLOOK ─────────────────────────────────────── */}
      {forecast.length > 0 && (
        <div className="section-card scale-in">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Activity size={14} color="#0891b2" />
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#0f172a" }}>3-Day Health Outlook</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            {[0, 24, 48].map((offset, i) => {
              const dayPoint = forecast[offset] || forecast[forecast.length - 1];
              const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : "In 2 Days";
              const isDanger = dayPoint.aqi > 150;
              return (
                <div key={i} style={{ 
                  background: "#f8fafc", borderRadius: "10px", 
                  padding: "16px 12px", textAlign: "center", border: "1px solid #e2e8f0"
                }}>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700 }}>{dayName}</div>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: isDanger ? "#dc2626" : "#0891b2" }}>
                    {dayPoint.aqi.toFixed(0)}
                  </div>
                  <div style={{ fontSize: "10px", color: isDanger ? "#dc2626" : "#64748b", marginTop: "4px", fontWeight: 600 }}>
                    {isDanger ? "⚠️ HIGH RISK" : "✓ LOW RISK"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}



    </div>
  );
}
