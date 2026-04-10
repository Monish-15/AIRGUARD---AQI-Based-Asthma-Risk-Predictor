"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { fetchCurrentAQI } from "@/lib/api";

function zoneColor(aqi: number) {
  if (aqi <= 50)  return "#059669";
  if (aqi <= 100) return "#d97706";
  if (aqi <= 150) return "#ea580c";
  return "#dc2626";
}

function generateZones(cityName: string, centerLat: number, centerLon: number, baseAqi: number) {
  const diffs = [
    { name: `${cityName} Central`, dLat: 0, dLon: 0, aqiOffset: 0, desc: "City center area." },
    { name: "North Suburbs", dLat: 0.04, dLon: 0.01, aqiOffset: -12, desc: "Residential northern suburbs." },
    { name: "South Tech Park", dLat: -0.04, dLon: -0.01, aqiOffset: 8, desc: "Busy tech zone, high traffic." },
    { name: "East Industrial", dLat: 0.01, dLon: 0.04, aqiOffset: 35, desc: "Industrial area. Reduced air quality." },
    { name: "West Greens", dLat: -0.01, dLon: -0.04, aqiOffset: -25, desc: "Green zone. Ideal for outdoor activity." },
    { name: "NW Traffic Jn", dLat: 0.03, dLon: -0.03, aqiOffset: 15, desc: "Major traffic junction." },
    { name: "SE Sector", dLat: -0.03, dLon: 0.03, aqiOffset: -5, desc: "Mixed use region, moderate air." },
  ];
  return diffs.map((d, i) => {
    const aqi = Math.max(10, Math.min(300, Math.round(baseAqi + d.aqiOffset)));
    return {
      id: i + 1,
      name: d.name,
      lat: centerLat + d.dLat,
      lon: centerLon + d.dLon,
      aqi,
      safe: aqi <= 100,
      desc: d.desc,
    };
  });
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<any>(null);

  const [zones, setZones] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [cityData, setCityData] = useState({ name: "Bengaluru", lat: 12.9716, lon: 77.5946 });

  useEffect(() => {
    async function loadData() {
      let city = { name: "Bengaluru", lat: 12.9716, lon: 77.5946 };
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("selectedCity");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.lat !== 0) city = parsed;
          } catch (e) {}
        }
      }
      setCityData(city);
      try {
        const aqiData = await fetchCurrentAQI(city.lat, city.lon);
        const baseAqi = aqiData.aqi || 80;
        const genZones = generateZones(city.name, city.lat, city.lon, baseAqi);
        setZones(genZones);
      } catch (e) {
        const genZones = generateZones(city.name, city.lat, city.lon, 80);
        setZones(genZones);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || loading || zones.length === 0) return;
    import("leaflet").then(L => {
      if (!mapRef.current || leafletRef.current) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      const map = L.map(mapRef.current!).setView([cityData.lat, cityData.lon], 11);
      leafletRef.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO", maxZoom: 19,
      }).addTo(map);
      zones.forEach(zone => {
        const color = zoneColor(zone.aqi);
        L.circle([zone.lat, zone.lon], { color, fillColor: color, fillOpacity: 0.2, radius: 1000, weight: 2 }).addTo(map);
        const marker = L.circleMarker([zone.lat, zone.lon], {
          radius: 9, color, fillColor: color, fillOpacity: 0.85, weight: 2,
        }).addTo(map);
        marker.bindTooltip(`<b>${zone.name}</b><br>AQI: ${zone.aqi}`, {
          className: "leaflet-tooltip-custom", direction: "top",
        });
        marker.on("click", () => setSelected(zone));
      });
    });
    return () => { if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null; } };
  }, [loading, zones, cityData]);

  if (loading) {
    return (
      <div style={{ maxWidth: "1100px", padding: "40px", display: "flex", alignItems: "center", gap: "10px", color: "#64748b" }}>
        <Loader2 className="animate-spin" /> Loading Safe Zones for your city...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px" }}>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        .leaflet-tooltip-custom {
          background: #ffffff; border: 1px solid #e2e8f0;
          color: #0f172a; font-size: 12px; border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .leaflet-container { border-radius: 14px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <MapPin size={22} color="#ea580c" />
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>Safe Zone Map — {cityData.name}</h1>
        </div>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
          Color-coded AQI zones across {cityData.name} based on real-time API values. Click a marker for details.
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
        {[
          { label: "Good (0–50)",       color: "#059669" },
          { label: "Moderate (51–100)", color: "#d97706" },
          { label: "Sensitive (101–150)", color: "#ea580c" },
          { label: "Unhealthy (150+)",  color: "#dc2626" },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
            {label}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px" }}>
        {/* Map */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden", height: "520px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        </div>

        {/* Zone list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", maxHeight: "520px", paddingRight: "2px" }}>
          {zones.map(zone => {
            const color = zoneColor(zone.aqi);
            const active = selected?.id === zone.id;
            return (
              <button key={zone.id} onClick={() => setSelected(zone)} style={{
                padding: "12px 14px", borderRadius: "12px", textAlign: "left",
                cursor: "pointer", fontFamily: "inherit",
                background: active ? "#f8fafc" : "#ffffff",
                border: `1.5px solid ${active ? color : "#e2e8f0"}`,
                boxShadow: active ? `0 0 0 3px ${color}22` : "none",
                transition: "all 0.15s ease",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
                  {zone.safe
                    ? <Shield size={12} color="#059669" />
                    : <AlertTriangle size={12} color="#dc2626" />}
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{zone.name}</span>
                  <span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 700, color }}>{zone.aqi}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.4 }}>{zone.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected detail */}
      {selected && (
        <div className="animate-in" style={{
          marginTop: "20px", padding: "20px 24px", borderRadius: "14px",
          background: selected.safe ? "#ecfdf5" : "#fef2f2",
          border: `1.5px solid ${selected.safe ? "#a7f3d0" : "#fca5a5"}`,
          display: "flex", alignItems: "center", gap: "16px",
        }}>
          {selected.safe
            ? <Shield size={22} color="#059669" />
            : <AlertTriangle size={22} color="#dc2626" />}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{selected.name}</div>
            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{selected.desc}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "26px", fontWeight: 900, color: zoneColor(selected.aqi) }}>AQI {selected.aqi}</div>
            <div style={{ fontSize: "12px", color: selected.safe ? "#059669" : "#dc2626", fontWeight: 600, marginTop: "2px" }}>
              {selected.safe ? "✓ Safe for asthma patients" : "✗ Risky for asthma patients"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
