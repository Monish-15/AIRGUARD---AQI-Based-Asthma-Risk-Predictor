"use client";
import { useState, useEffect } from "react";
import { createUser } from "@/lib/api";
import { Save, User, Heart, Pill, MapPin, CheckCircle2, FileText, Bell, Mail, Smartphone } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TRIGGERS = ["PM2.5", "PM10", "Smoke", "Dust", "Pollen", "Humidity", "Cold Air", "Exercise", "Pet Dander", "Mold"];
const SEVERITIES = [
  { value: 0, label: "No Asthma",  color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
  { value: 1, label: "Mild",       color: "#d97706", bg: "#fffbeb", border: "#fcd34d" },
  { value: 2, label: "Moderate",   color: "#ea580c", bg: "#fff7ed", border: "#fdba74" },
  { value: 3, label: "Severe",     color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
];

function PageHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "32px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        {icon}
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
      </div>
      <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>{subtitle}</p>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#ffffff", border: "1px solid #e2e8f0",
      borderRadius: "14px", padding: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      ...style,
    }}>{children}</div>
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
      {icon}
      <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{title}</span>
    </div>
  );
}

export default function ProfilePage() {
  const [form, setForm] = useState({
    name: "", email: "", phone_number: "", age: "", asthma_severity: 1,
    known_triggers: [] as string[], medications: "",
    home_lat: "12.9716", home_lon: "77.5946",
    alerts_email: true,
    alerts_whatsapp: false,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [testSent, setTestSent] = useState(false);
  const [waTestSent, setWaTestSent] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingWaTest, setSendingWaTest] = useState(false);

  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (id) {
      import("@/lib/api").then(({ get_user_profile }) => {
        get_user_profile(Number(id)).then(data => {
          setForm({
            name: data.name || "",
            email: data.email || "",
            phone_number: data.phone_number || "",
            age: String(data.age || ""),
            asthma_severity: data.asthma_severity ?? 1,
            known_triggers: data.known_triggers || [],
            medications: (data.medications || []).join(", "),
            home_lat: String(data.home_lat || ""),
            home_lon: String(data.home_lon || ""),
            alerts_email: !!data.alerts_email,
            alerts_whatsapp: !!data.alerts_whatsapp,
          });
          setUserId(Number(id));
        }).catch(err => console.error("Error loading profile:", err));
      });
    }
  }, []);

  const toggleTrigger = (t: string) => {
    setForm(f => ({
      ...f,
      known_triggers: f.known_triggers.includes(t)
        ? f.known_triggers.filter(x => x !== t)
        : [...f.known_triggers, t],
    }));
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name, email: form.email,
        phone_number: form.phone_number,
        age: form.age ? Number(form.age) : undefined,
        asthma_severity: form.asthma_severity,
        known_triggers: form.known_triggers,
        medications: form.medications ? form.medications.split(",").map(s => s.trim()) : [],
        home_lat: Number(form.home_lat) || undefined,
        home_lon: Number(form.home_lon) || undefined,
        alerts_email: form.alerts_email ? 1 : 0,
        alerts_whatsapp: form.alerts_whatsapp ? 1 : 0,
      };

      let res;
      const existingId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
      
      if (existingId) {
        // Import dynamic to avoid circularity if any, or just use the lib
        const { updateUser } = await import("@/lib/api");
        res = await updateUser(Number(existingId), payload);
      } else {
        res = await createUser(payload);
      }
      
      setUserId(res.id);
      setSaved(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("userId", String(res.id));
        localStorage.setItem("userName", res.name);
      }
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to save profile. Please try again.");
    }
    finally { setSaving(false); }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.text("AirGuard Medical Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Patient: ${form.name || "Unknown"} | Age: ${form.age || "N/A"}`, 14, 36);

    autoTable(doc, {
      startY: 45,
      head: [["Profile Metric", "Value"]],
      body: [
        ["Asthma Severity", SEVERITIES.find(s => s.value === form.asthma_severity)?.label || "N/A"],
        ["Known Triggers", form.known_triggers.length > 0 ? form.known_triggers.join(", ") : "None Logged"],
        ["Medications", form.medications || "None Logged"]
      ],
      headStyles: { fillColor: [37, 99, 235] },
    });

    const dummyData = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      const aqi = Math.floor(Math.random() * 150 + 20);
      let symptoms = "None";
      if (aqi > 100) symptoms = "Wheezing, Tightness";
      else if (aqi > 70 && Math.random() > 0.5) symptoms = "Coughing";
      return [d.toLocaleDateString(), aqi.toString(), symptoms];
    });

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("30-Day Exposure & Symptom History", 14, (doc as any).lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 16,
      head: [["Date", "Peak AQI Exposure", "Reported Symptoms"]],
      body: dummyData,
      headStyles: { fillColor: [15, 23, 42] },
    });

    doc.save(`${form.name || "Patient"}_Asthma_Report.pdf`);
  };

  return (
    <div style={{ maxWidth: "720px" }}>
      <PageHeader
        title="My Health Profile"
        subtitle="Personalises the risk prediction model and manages alerts."
        icon={<User size={22} color="#2563eb" />}
      />

      {saved && (
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          marginBottom: "24px", padding: "14px 18px", borderRadius: "12px",
          background: "#ecfdf5", border: "1px solid #a7f3d0",
        }}>
          <CheckCircle2 size={16} color="#059669" />
          <span style={{ color: "#059669", fontSize: "14px", fontWeight: 500 }}>
            Profile saved! User ID: {userId}. Predictions are now personalised.
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <Card>
          <CardHeader icon={<User size={15} color="#2563eb" />} title="Basic Information" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              { key: "name",  label: "Full Name", type: "text",   placeholder: "Monish Kumar" },
              { key: "email", label: "Email",     type: "email",  placeholder: "you@email.com" },
              { key: "phone_number", label: "Phone Number", type: "tel", placeholder: "+91 98765 43210" },
              { key: "age",   label: "Age",       type: "number", placeholder: "22" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="input-label">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={(form as any)[key] || ""}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input-field"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader icon={<Heart size={15} color="#dc2626" />} title="Asthma Severity" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
            {SEVERITIES.map(s => {
              const active = form.asthma_severity === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setForm(f => ({ ...f, asthma_severity: s.value }))}
                  style={{
                    padding: "11px 8px", borderRadius: "10px", cursor: "pointer",
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
        </Card>

        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>⚡</span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Known Triggers</span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {TRIGGERS.map(t => {
              const sel = form.known_triggers.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTrigger(t)}
                  style={{
                    padding: "7px 14px", borderRadius: "99px", cursor: "pointer",
                    border: `1.5px solid ${sel ? "#93c5fd" : "#e2e8f0"}`,
                    background: sel ? "#eff6ff" : "#fafafa",
                    color: sel ? "#2563eb" : "#64748b",
                    fontSize: "13px", fontWeight: sel ? 600 : 400,
                    transition: "all 0.15s ease", fontFamily: "inherit",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader icon={<Pill size={15} color="#7c3aed" />} title="Medications" />
          <input
            type="text"
            placeholder="Salbutamol, Budesonide, Montelukast (comma separated)"
            value={form.medications || ""}
            onChange={e => setForm(f => ({ ...f, medications: e.target.value }))}
            className="input-field"
          />
        </Card>

        <Card>
          <CardHeader icon={<MapPin size={15} color="#ea580c" />} title="Home Location" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="input-label">Latitude</label>
              <input value={form.home_lat || ""} onChange={e => setForm(f => ({ ...f, home_lat: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="input-label">Longitude</label>
              <input value={form.home_lon || ""} onChange={e => setForm(f => ({ ...f, home_lon: e.target.value }))} className="input-field" />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader icon={<Bell size={15} color="#2563eb" />} title="Proactive Health Alerts" />
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "-12px", marginBottom: "18px" }}>
            Receive a warning every morning at 7:00 AM if your local air quality or pollen levels pose a high risk.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Mail size={16} color="#64748b" />
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>Email Notifications</span>
              </div>
              <button 
                onClick={() => setForm(f => ({ ...f, alerts_email: !f.alerts_email }))}
                style={{
                  width: "40px", height: "20px", borderRadius: "20px", border: "none", cursor: "pointer",
                  background: form.alerts_email ? "#2563eb" : "#cbd5e1", transition: "all 0.2s",
                  position: "relative"
                }}
              >
                <div style={{
                  position: "absolute", top: "2px", left: form.alerts_email ? "22px" : "2px",
                  width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "all 0.2s"
                }} />
              </button>
            </div>
            {form.alerts_email && (
              <div style={{ marginTop: "4px" }}>
                <button
                  onClick={async () => {
                    if (!form.email) return;
                    setSendingTest(true);
                    try {
                      const { sendTestEmail } = await import("@/lib/api");
                      await sendTestEmail(form.email, form.name || "User");
                      setTestSent(true);
                      setTimeout(() => setTestSent(false), 5000);
                    } catch (e) {
                      console.error(e);
                      alert("Test search failed. Check if SMTP is configured in backend/.env");
                    } finally { setSendingTest(false); }
                  }}
                  disabled={sendingTest || !form.email}
                  style={{
                    fontSize: "12px", color: testSent ? "#059669" : "#2563eb",
                    background: "none", border: "none", padding: "0 12px",
                    textDecoration: "underline", cursor: "pointer", fontWeight: 600,
                  }}
                >
                  {sendingTest ? "Sending..." : testSent ? "✅ Test Dispatch Successful (Check Console/Email)" : "Send Test Notification →"}
                </button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "16px" }}>💬</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>WhatsApp Notifications</span>
              </div>
              <button 
                onClick={() => setForm(f => ({ ...f, alerts_whatsapp: !f.alerts_whatsapp }))}
                style={{
                  width: "40px", height: "20px", borderRadius: "20px", border: "none", cursor: "pointer",
                  background: form.alerts_whatsapp ? "#25d366" : "#cbd5e1", transition: "all 0.2s",
                  position: "relative"
                }}
              >
                <div style={{
                  position: "absolute", top: "2px", left: form.alerts_whatsapp ? "22px" : "2px",
                  width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "all 0.2s"
                }} />
              </button>
            </div>
            {form.alerts_whatsapp && (
              <div style={{ marginTop: "4px" }}>
                <button
                  onClick={async () => {
                    if (!form.phone_number) {
                      alert("Please enter your phone number in basic info first!");
                      return;
                    }
                    setSendingWaTest(true);
                    try {
                      const { sendWaTest } = await import("@/lib/api");
                      await sendWaTest(form.phone_number, form.name || "User");
                      setWaTestSent(true);
                      setTimeout(() => setWaTestSent(false), 5000);
                    } catch (e: any) {
                      console.error(e);
                      alert(e.message || "WhatsApp test failed. Check backend/.env");
                    } finally { setSendingWaTest(false); }
                  }}
                  disabled={sendingWaTest || !form.phone_number}
                  style={{
                    fontSize: "12px", color: waTestSent ? "#059669" : "#25d366",
                    background: "none", border: "none", padding: "0 12px",
                    textDecoration: "underline", cursor: "pointer", fontWeight: 600,
                  }}
                >
                  {sendingWaTest ? "Sending..." : waTestSent ? "✅ WhatsApp Sent (Check Phone)" : "Send WhatsApp Test Notification →"}
                </button>
              </div>
            )}
          </div>
        </Card>

        <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.email}
            className="predict-btn"
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
          >
            <Save size={16} />
            {saving ? "Saving…" : "Save Profile"}
          </button>
          <button
            onClick={handleExportPDF}
            style={{ 
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1",
              borderRadius: "14px", fontWeight: 700, fontSize: "15px", cursor: "pointer",
              transition: "all 0.2s ease"
            }}
          >
            <FileText size={16} />
            Doctor Report (.pdf)
          </button>
        </div>
      </div>
    </div>
  );
}
