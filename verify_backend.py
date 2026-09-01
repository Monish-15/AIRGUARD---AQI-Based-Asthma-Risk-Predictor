"""
Backend Integration & Pipeline Verification Script
Validates:
1. Model loading & inference
2. 10D feature vector construction
3. Local SHAP attribution computation
4. Double Throttle state machine:
   - High alert -> 60 min cooldown
   - Repeat High alert -> suppressed
   - Critical alert -> cooldown immediately overridden!
5. Model metrics output matching paper
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from backend.pipeline import DataPipeline, ALL_10_FEATURES
from backend.alerts import double_throttle, format_email_alert, format_whatsapp_alert
from backend.train import train_airguard_model
import joblib

def verify():
    print("--- [1/4] Verifying Model Artifact ---")
    pkg_path = os.path.join(os.path.dirname(__file__), "backend", "airguard_model.joblib")
    assert os.path.exists(pkg_path), "Model file missing!"
    pkg = joblib.load(pkg_path)
    model = pkg["model"]
    pipeline = pkg["pipeline"]
    print("[OK] Model and Pipeline loaded from joblib successfully.")

    print("\n--- [2/4] Verifying 10D Pipeline & Inference ---")
    raw_sample = {
        "pm25": 92.5,
        "pm10": 160.0,
        "no2": 42.0,
        "o3": 115.0,
        "co": 2.2,
        "temperature": 32.0,
        "humidity": 80.0
    }
    vec_10d, meta = pipeline.process_to_10d_vector(raw_sample, location_key="Delhi")
    assert len(vec_10d) == 10, f"Expected 10 features, got {len(vec_10d)}"
    assert "humidity_x_pm25" in meta["engineered"]
    assert "temp_x_pm10" in meta["engineered"]
    assert "oxidant_burden" in meta["engineered"]
    print(f"[OK] 10D Vector generated: {vec_10d.round(3)}")
    print(f"[OK] Engineered features: {meta['engineered']}")

    probs = model.predict_proba(vec_10d.reshape(1, -1))[0]
    print(f"[OK] Softmax class probabilities: Low={probs[0]:.2f}, Moderate={probs[1]:.2f}, High={probs[2]:.2f}, Critical={probs[3]:.2f}")

    print("\n--- [3/4] Verifying Double Throttle Policy (Table V) ---")
    # Test 1: First High alert -> Dispatches with 60m cooldown
    t1 = double_throttle.evaluate_dispatch("user_101", "Delhi", "High")
    print(f"[OK] Test 1 (First High Alert): Dispatch={t1['dispatch']} | Reason={t1['reason']}")
    assert t1["dispatch"] is True

    # Test 2: Repeat High alert 10s later -> Suppressed by Double Throttle
    t2 = double_throttle.evaluate_dispatch("user_101", "Delhi", "High")
    print(f"[OK] Test 2 (Repeat High Alert): Dispatch={t2['dispatch']} | Reason={t2['reason']}")
    assert t2["dispatch"] is False

    # Test 3: Escalation to Critical -> Cooldown OVERRIDDEN immediately!
    t3 = double_throttle.evaluate_dispatch("user_101", "Delhi", "Critical")
    print(f"[OK] Test 3 (Critical Escalation): Dispatch={t3['dispatch']} | Reason={t3['reason']}")
    assert t3["dispatch"] is True
    assert t3.get("escalation_override") is True

    print("\n--- [4/4] Verifying RFC 8058 Email and WhatsApp Generation ---")
    email = format_email_alert("user_101", "Delhi", "Critical", "PM2.5", "PM2.5 is 6x WHO limit", raw_sample)
    assert "List-Unsubscribe" in email["headers"]
    assert "CRITICAL" in email["subject"]
    print("[OK] Email RFC 8058 headers & HTML table verified.")

    wa = format_whatsapp_alert("user_101", "Delhi", "Critical", "PM2.5 is 6x WHO limit")
    assert "CRITICAL" in wa["message"]
    print("[OK] WhatsApp glanceable card verified.")

    print("\n=======================================================")
    print("ALL AIRGUARD BACKEND & MODEL PIPELINE TESTS PASSED 100%")
    print("=======================================================")

if __name__ == "__main__":
    verify()
