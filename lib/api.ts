const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:800";

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
}

/**
 * Shared error parser for FastAPI responses
 */
async function handleResponse(res: Response, fallbackMsg: string) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    let msg = `${fallbackMsg} (${res.status})`;
    
    if (data.detail) {
      if (typeof data.detail === "string") {
        msg = data.detail;
      } else if (Array.isArray(data.detail)) {
        // FastAPI validation error format
        msg = data.detail[0]?.msg || msg;
        if (data.detail[0]?.loc) {
          const field = data.detail[0].loc[data.detail[0].loc.length - 1];
          msg = `${field}: ${msg}`;
        }
      }
    }
    
    console.error(`${fallbackMsg} Error:`, res.status, data);
    throw new Error(msg);
  }
  return res.json();
}

export async function fetchCurrentAQI(lat = 12.9716, lon = 77.5946) {
  const res = await fetch(`${API_BASE}/api/aqi/current?lat=${lat}&lon=${lon}`);
  return handleResponse(res, "Failed to fetch AQI");
}

export async function fetchAQIForecast(lat = 12.9716, lon = 77.5946, hours = 24) {
  const res = await fetch(`${API_BASE}/api/aqi/forecast?lat=${lat}&lon=${lon}&hours=${hours}`);
  return handleResponse(res, "Failed to fetch forecast");
}

export async function predictRiskFull(payload: any) {
  const res = await fetch(`${API_BASE}/api/risk/full`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Failed to predict risk");
}

export async function predictRiskWithWearable(payload: any) {
  const res = await fetch(`${API_BASE}/api/risk/wearable`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res, "Failed to predict wearable risk");
}

export async function getInsights(userId: number) {
  const res = await fetch(`${API_BASE}/api/insights/${userId}`);
  return handleResponse(res, "Failed to fetch insights");
}

export async function getUserLogs(userId: number, limit = 30) {
  const res = await fetch(`${API_BASE}/api/user/${userId}/logs?limit=${limit}`);
  return handleResponse(res, "Failed to fetch logs");
}

export async function get_user_profile(userId: number) {
  const res = await fetch(`${API_BASE}/api/user/${userId}`, {
    headers: getAuthHeaders()
  });
  return handleResponse(res, "Failed to fetch user profile");
}

export async function updateUser(userId: number, data: any) {
  const res = await fetch(`${API_BASE}/api/user/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update profile");
}

export async function createUser(data: any) {
  console.log(`[API] Creating profile at: ${API_BASE}/api/user/`);
  const res = await fetch(`${API_BASE}/api/user/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create profile");
}

export async function loginUser(data: any) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Login failed");
}

export async function registerUser(data: any) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Registration failed");
}

export async function sendTestEmail(email: string, name: string) {
  const res = await fetch(`${API_BASE}/api/notify/test-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name, risk_level: "High" }),
  });
  return handleResponse(res, "Failed to send test email");
}

export async function sendWaTest(phone: string, name: string) {
  const res = await fetch(`${API_BASE}/api/notify/test-whatsapp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, name }),
  });
  return handleResponse(res, "Failed to send WhatsApp test");
}
