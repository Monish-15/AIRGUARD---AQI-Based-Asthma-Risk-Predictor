"use client";
import { useState, useCallback } from "react";
import { fetchCurrentAQI } from "@/lib/api";
import { MapPin, Search, Loader2, Scale, Wind, Thermometer, Droplets, Zap, Shield, AlertTriangle } from "lucide-react";

const DEF_DATA = { aqi: null, pm25: null, pm10: null, temp: null, humidity: null, no2: null };

function riskColor(aqi: number) {
  if (aqi <= 50) return "#059669";
  if (aqi <= 100) return "#d97706";
  if (aqi <= 150) return "#ea580c";
  return "#dc2626";
}

function CitySearch({
  id, label, placeholder, city, setCity, data, setData, loading, setLoading
}: {
  id: string, label: string, placeholder: string,
  city: any, setCity: any, data: any, setData: any,
  loading: boolean, setLoading: any
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const payload = await res.json();
      setResults(payload);
    } catch { }
    setSearching(false);
  };

  const selectLoc = async (loc: any) => {
    const c = { name: loc.display_name.split(",")[0], lat: parseFloat(loc.lat), lon: parseFloat(loc.lon) };
    setCity(c);
    setQuery("");
    setResults([]);
    
    setLoading(true);
    try {
      const aqiData = await fetchCurrentAQI(c.lat, c.lon);
      setData({
        aqi: aqiData.aqi, pm25: aqiData.pm25, pm10: aqiData.pm10,
        temp: aqiData.temperature, humidity: aqiData.humidity, no2: aqiData.no2,
      });
    } catch {
      setData({ ...DEF_DATA });
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <label className="input-label" htmlFor={id}>{label}</label>
      <div style={{ display: "flex", gap: "8px" }}>
        <input id={id} type="text" className="input-field" placeholder={placeholder}
          value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()} style={{ flex: 1 }}
        />
        <button onClick={handleSearch} disabled={searching} style={{
          background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", gap: "6px",
          padding: "0 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none"
        }}>
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </button>
      </div>

      {results.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, marginTop: "6px", background: "#fff",
          border: "1px solid #e2e8f0", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", zIndex: 50, overflow: "hidden"
        }}>
          {results.map((loc: any, i) => (
            <button key={i} onClick={() => selectLoc(loc)} style={{
              width: "100%", textAlign: "left", padding: "10px 14px", border: "none",
              background: i % 2 === 0 ? "#fff" : "#f8fafc", cursor: "pointer", fontFamily: "inherit",
              borderBottom: i === results.length - 1 ? "none" : "1px solid #f1f5f9",
            }}>
              <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "13px" }}>{loc.display_name.split(",")[0]}</div>
              <div style={{ color: "#64748b", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{loc.display_name}</div>
            </button>
          ))}
        </div>
      )}

      {city && (
        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <MapPin size={13} color="#2563eb" />
          <span style={{ fontWeight: 700, color: "#0f172a" }}>{city.name}</span>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const [cityA, setCityA] = useState<any>(null);
  const [cityB, setCityB] = useState<any>(null);
  const [dataA, setDataA] = useState<any>({ ...DEF_DATA });
  const [dataB, setDataB] = useState<any>({ ...DEF_DATA });
  const [loadA, setLoadA] = useState(false);
  const [loadB, setLoadB] = useState(false);

  const T = { primary: "#0f172a", secondary: "#334155", muted: "#94a3b8", border: "#e2e8f0" };

  const ready = dataA.aqi !== null && dataB.aqi !== null;
  const winner = ready ? (dataA.aqi < dataB.aqi ? "A" : dataB.aqi < dataA.aqi ? "B" : "TIE") : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "60px", maxWidth: "900px" }}>

      {/* HEADER */}
      <div className="animate-in" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Scale size={24} color="#059669" />
          <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, color: T.primary, letterSpacing: "-0.02em" }}>
            City Comparison
          </h1>
        </div>
        <p style={{ color: T.muted, fontSize: "14px", marginTop: "5px" }}>
          Evaluate and compare real-time air quality metrics between any two global locations instantly.
        </p>
      </div>

      {/* SEARCH SECTION */}
      <div className="section-card animate-in" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <CitySearch
          id="search-a" label="Location A" placeholder="e.g. London"
          city={cityA} setCity={setCityA} data={dataA} setData={setDataA}
          loading={loadA} setLoading={setLoadA}
        />
        <CitySearch
          id="search-b" label="Location B" placeholder="e.g. Paris"
          city={cityB} setCity={setCityB} data={dataB} setData={setDataB}
          loading={loadB} setLoading={setLoadB}
        />
      </div>

      {/* WINNER BANNER */}
      {ready && winner && (
        <div className="animate-in" style={{
          background: winner === "TIE" ? "#f8fafc" : "#ecfdf5",
          border: `1px solid ${winner === "TIE" ? "#e2e8f0" : "#a7f3d0"}`,
          borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px"
        }}>
          {winner === "TIE" ? <AlertTriangle size={20} color="#64748b" /> : <Shield size={20} color="#059669" />}
          <div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "15px" }}>
              {winner === "TIE" ? "Both locations have identical air quality." :
               `${winner === "A" ? cityA.name : cityB.name} is the safer choice.`}
            </div>
            <div style={{ fontSize: "13px", color: T.secondary, marginTop: "2px" }}>
              {winner !== "TIE" && `AQI is ${(Math.abs(dataA.aqi - dataB.aqi))} points lower than the alternative.`}
            </div>
          </div>
        </div>
      )}

      {/* METRICS COMPARISON GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* COLUMN A */}
        <div className="section-card animate-in" style={{ display: "flex", flexDirection: "column", gap: "16px", opacity: loadA ? 0.5 : 1 }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: T.primary, textAlign: "center", borderBottom: `1px solid ${T.border}`, paddingBottom: "12px" }}>
            {cityA ? cityA.name : "Location A"}
          </div>
          {dataA.aqi !== null ? (
            <>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>AQI</div>
                <div style={{ fontSize: "52px", fontWeight: 900, color: riskColor(dataA.aqi), lineHeight: 1, margin: "8px 0" }}>{dataA.aqi}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "PM2.5", val: dataA.pm25, icon: Wind, unit: "μg/m³" },
                  { label: "PM10",  val: dataA.pm10, icon: Wind, unit: "μg/m³" },
                  { label: "NO₂",   val: dataA.no2,  icon: Zap,  unit: "ppb" },
                  { label: "Temp",  val: dataA.temp, icon: Thermometer, unit: "°C" },
                  { label: "Humid", val: dataA.humidity, icon: Droplets, unit: "%" },
                ].map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: T.secondary, fontWeight: 600 }}>
                      <m.icon size={13} color="#64748b" /> {m.label}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: T.primary }}>
                      {m.val} <span style={{ fontSize: "10px", color: T.muted, fontWeight: 500 }}>{m.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: "13px" }}>
              {loadA ? <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto" }} /> : "Search a location to compare."}
            </div>
          )}
        </div>

        {/* COLUMN B */}
        <div className="section-card animate-in" style={{ display: "flex", flexDirection: "column", gap: "16px", opacity: loadB ? 0.5 : 1 }}>
          <div style={{ fontSize: "16px", fontWeight: 800, color: T.primary, textAlign: "center", borderBottom: `1px solid ${T.border}`, paddingBottom: "12px" }}>
            {cityB ? cityB.name : "Location B"}
          </div>
          {dataB.aqi !== null ? (
            <>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>AQI</div>
                <div style={{ fontSize: "52px", fontWeight: 900, color: riskColor(dataB.aqi), lineHeight: 1, margin: "8px 0" }}>{dataB.aqi}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "PM2.5", val: dataB.pm25, icon: Wind, unit: "μg/m³" },
                  { label: "PM10",  val: dataB.pm10, icon: Wind, unit: "μg/m³" },
                  { label: "NO₂",   val: dataB.no2,  icon: Zap,  unit: "ppb" },
                  { label: "Temp",  val: dataB.temp, icon: Thermometer, unit: "°C" },
                  { label: "Humid", val: dataB.humidity, icon: Droplets, unit: "%" },
                ].map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: T.secondary, fontWeight: 600 }}>
                      <m.icon size={13} color="#64748b" /> {m.label}
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: T.primary }}>
                      {m.val} <span style={{ fontSize: "10px", color: T.muted, fontWeight: 500 }}>{m.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: "13px" }}>
              {loadB ? <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto" }} /> : "Search a location to compare."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
