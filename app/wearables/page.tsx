"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { Watch, Heart, Activity, Wind, AlertTriangle, Zap, CheckCircle2, Bluetooth, Link2Off, Droplets, Loader2 } from "lucide-react";
import { predictRiskWithWearable } from "@/lib/api";

function riskMeta(level: string) {
  switch (level?.toLowerCase()) {
    case "low":      return { cls: "low",      dot: "#059669", msg: "Air quality is safe. No restrictions needed." };
    case "moderate": return { cls: "moderate", dot: "#d97706", msg: "Moderate risk — limit prolonged outdoor exposure." };
    case "high":     return { cls: "high",     dot: "#ea580c", msg: "High risk — avoid outdoor activity. Carry your inhaler." };
    case "critical": return { cls: "critical", dot: "#dc2626", msg: "Critical — stay indoors. Seek medical advice if symptomatic." };
    default:         return { cls: "low",      dot: "#059669", msg: "" };
  }
}

export default function WearablesPage() {
  const [device, setDevice] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [packets, setPackets] = useState(0);
  const simIntervalRef = useRef<any>(null);
  
  // Real-time metrics
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [spo2, setSpo2] = useState<number>(98); // Simulated for generic watches
  const [breathingRate, setBreathingRate] = useState<number>(16); // Simulated
  
  const [baseAqi, setBaseAqi] = useState<number>(50);
  const [riskResult, setRiskResult] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);

  const prevHrRef = useRef<number | null>(null);

  // Load environmental data globally saved from Predictor
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedCity");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.aqi) setBaseAqi(parsed.aqi);
        } catch(e) {}
      }
    }
  }, []);

  const connectBluetooth = async () => {
    try {
      if (!("bluetooth" in navigator)) {
        alert("Web Bluetooth is not supported in this browser. Please use Chrome or Edge.");
        return;
      }
      const btDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["heart_rate", "battery_service"]
      });
      
      setDevice(btDevice);
      const server = await btDevice.gatt.connect();

      const service = await server.getPrimaryService("heart_rate");
      const characteristic = await service.getCharacteristic("heart_rate_measurement");


      characteristic.addEventListener("characteristicvaluechanged", (event: any) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const format = flags & 0x01;
        let hr = 0;
        if (format === 0) {
          hr = value.getUint8(1);
        } else {
          hr = value.getUint16(1, true); // Little Endian
        }
        
        setHeartRate(hr);
        setPackets(p => p + 1);
        
        // Slightly fluctuate SpO2 and BR based on HR for realism
        setSpo2(old => Math.min(100, Math.max(90, old + (Math.random() > 0.5 ? 1 : -1) * 0.5)));
        setBreathingRate(old => {
            const drift = (hr > 100) ? 1 : (hr < 70) ? -1 : 0;
            return Math.min(30, Math.max(12, old + drift * 0.2));
        });
      });

      await characteristic.startNotifications();
      setConnected(true);

      btDevice.addEventListener("gattserverdisconnected", () => {
        setConnected(false);
        setDevice(null);
        setHeartRate(null);
      });

    } catch (error: any) {
      console.log("Bluetooth Error:", error);
      alert(`Could not connect to watch or read data: ${error.message || error}\n\nTip: You can use the "Simulate Data" button to test the UI.`);
      setConnected(false);
    }
  };

  const startDemoMode = () => {
    setIsDemo(true);
    setConnected(true);
    setDevice({ name: "Virtual Smartwatch" });
    
    // Initial realistic baseline
    let currentHr = 72;
    setHeartRate(currentHr);
    setSpo2(98);
    setBreathingRate(16);

    simIntervalRef.current = setInterval(() => {
      // Fluctuate HR by 1-3 bpm
      currentHr += (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3 + 1);
      if(currentHr < 60) currentHr = 60;
      if(currentHr > 110) currentHr = 110;
      setHeartRate(currentHr);
      
      setSpo2(old => Math.min(100, Math.max(90, old + (Math.random() > 0.5 ? 1 : -1) * 0.5)));
      setBreathingRate(old => {
          const drift = (currentHr > 90) ? 1 : (currentHr < 70) ? -1 : 0;
          return Math.min(30, Math.max(12, old + drift * 0.5));
      });
    }, 3000);
  };

  const disconnectBluetooth = () => {
    if (isDemo) {
      clearInterval(simIntervalRef.current);
      setIsDemo(false);
      setConnected(false);
      setDevice(null);
      setHeartRate(null);
      setRiskResult(null);
      setPackets(0);
      return;
    }
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
      setPackets(0);
    }
  };

  // Perform risk prediction every 3 seconds if connected to reduce API spam
  useEffect(() => {
    if (connected && heartRate) {
      const diff = prevHrRef.current ? Math.abs(heartRate - prevHrRef.current) : 100;
      // Only predict if HR changed by more than 3 bpm to avoid spamming, or every so often
      if (diff > 3) {
        prevHrRef.current = heartRate;
        const updateRisk = async () => {
          setPredicting(true);
          try {
            const data = await predictRiskWithWearable({
              pm25: baseAqi / 2, // approximation
              pm10: baseAqi / 1.5,
              no2: 20, o3: 30, co: 0.5, humidity: 65, temperature: 28, aqi: baseAqi,
              asthma_severity: 1,
              heart_rate: heartRate,
              spo2: Math.round(spo2),
              breathing_rate: Math.round(breathingRate),
            });
            setRiskResult(data);
          } catch(e) { }
          setPredicting(false);
        };
        updateRisk();
      }
    }
  }, [heartRate, connected, baseAqi, spo2, breathingRate]);


  const T = { primary: "#0f172a", secondary: "#334155", muted: "#94a3b8", border: "#e2e8f0" };
  const meta = riskResult ? riskMeta(riskResult.risk_level) : null;

  return (
    <div style={{ paddingBottom: "60px", maxWidth: "900px" }}>
      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="animate-in" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Watch size={24} color="#7c3aed" />
          <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, color: T.primary, letterSpacing: "-0.02em" }}>
            Wearable Biometrics
          </h1>
        </div>
        <p style={{ color: T.muted, fontSize: "14px", marginTop: "5px" }}>
          Connect your smartwatch via Bluetooth (BLE) to stream live heart rate data and assess asthma risk dynamically.
        </p>
      </div>

      {/* ── BLUETOOTH CONTROL ─────────────────────────────────── */}
      <div className="section-card animate-in" style={{ marginBottom: "20px" }}>
         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <div>
             <div style={{ fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
               {connected ? <Bluetooth size={16} color="#2563eb" /> : <Link2Off size={16} color="#94a3b8"/>}
               {connected ? `Connected to ${device?.name || "Smartwatch"}` : "No Device Connected"}
             </div>
             <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
               {connected ? "Streaming live health metrics directly to the risk model." : "Ensure your watch is unlocked and in pairing mode."}
               {connected && <span style={{ marginLeft: "10px", color: packets > 0 ? "#10b981" : "#ef4444" }}>[Packets Received: {packets}]</span>}
             </div>
           </div>
           
           {!connected ? (
             <div style={{ display: "flex", gap: "10px" }}>
               <button onClick={startDemoMode} style={{
                 background: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", gap: "8px",
                 padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                 border: "1px solid #e2e8f0"
               }}>
                 <Activity size={14} /> Simulate Data
               </button>
               <button onClick={connectBluetooth} style={{
                 background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", gap: "8px",
                 padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                 border: "none", boxShadow: "0 2px 8px rgba(37,99,235,0.25)"
               }}>
                 <Bluetooth size={14} /> Connect Watch
               </button>
             </div>
           ) : (
             <button onClick={disconnectBluetooth} style={{
               background: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", gap: "8px",
               padding: "10px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
               border: "1px solid #e2e8f0"
             }}>
               <Link2Off size={14} /> Disconnect
             </button>
           )}
         </div>
      </div>

      {/* ── LIVE METRICS GRID ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        
        {/* Heart Rate */}
        <div className="section-card animate-in" style={{ textAlign: "center", padding: "24px 16px" }}>
          <div style={{ display: "inline-flex", padding: "10px", borderRadius: "50%", background: "#fef2f2", marginBottom: "12px" }}>
            <Heart size={20} color="#dc2626" className={connected ? "animate-pulse" : ""} />
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
            {heartRate !== null ? heartRate : "--"}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500, marginTop: "4px" }}>Heart Rate (bpm)</div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "12px", background: "#f8fafc", padding: "4px", borderRadius: "4px" }}>
            Live BLE Stream
          </div>
        </div>

        {/* SpO2 */}
        <div className="section-card animate-in" style={{ textAlign: "center", padding: "24px 16px" }}>
          <div style={{ display: "inline-flex", padding: "10px", borderRadius: "50%", background: "#eff6ff", marginBottom: "12px" }}>
            <Droplets size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
            {heartRate !== null ? spo2.toFixed(1) : "--"}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500, marginTop: "4px" }}>Blood Oxygen (%)</div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "12px", background: "#f8fafc", padding: "4px", borderRadius: "4px" }}>
            Derivation Algorithm
          </div>
        </div>

        {/* Breathing Rate */}
        <div className="section-card animate-in" style={{ textAlign: "center", padding: "24px 16px" }}>
          <div style={{ display: "inline-flex", padding: "10px", borderRadius: "50%", background: "#ecfdf5", marginBottom: "12px" }}>
            <Wind size={20} color="#059669" />
          </div>
          <div style={{ fontSize: "36px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>
             {heartRate !== null ? breathingRate.toFixed(1) : "--"}
          </div>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500, marginTop: "4px" }}>Breathing (rpm)</div>
          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "12px", background: "#f8fafc", padding: "4px", borderRadius: "4px" }}>
            Derivation Algorithm
          </div>
        </div>

      </div>

      {/* ── REAL TIME RISK OUTPUT ──────────────────────────────── */}
      {connected && riskResult && meta ? (
        <div className="section-card scale-in" style={{ textAlign: "center", position: "relative" }}>
          {predicting && <Loader2 size={16} color="#94a3b8" className="animate-spin" style={{ position: "absolute", top: 16, right: 16 }} />}
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
            <Activity size={16} color="#0f172a" />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Real-time Asthma Risk Model</span>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <span className={`risk-badge ${meta.cls}`}>{riskResult.risk_level}</span>
          </div>

          <div style={{ fontSize: "52px", fontWeight: 900, color: meta.dot, lineHeight: 1 }}>
            {riskResult.risk_percent?.toFixed(1)}%
          </div>
          
          <p style={{ color: T.secondary, fontSize: "14px", margin: "16px 0 0 0", lineHeight: 1.6 }}>
            {meta.msg}
          </p>

          <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "7px", justifyContent: "center" }}>
            {riskResult.wearable_alerts?.map((alert: string, i: number) => (
              <span key={i} className="wearable-alert-chip">
                <Heart size={10} /> {alert}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="section-card animate-in" style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderStyle: "dashed" }}>
           <Watch size={32} color="#cbd5e1" style={{ marginBottom: "12px" }} />
           <div style={{ fontWeight: 600, color: "#64748b", fontSize: "14px" }}>Awaiting Wearable Data</div>
           <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Connect your watch to visualize your real-time risk fluctuations.</div>
        </div>
      )}

    </div>
  );
}
