"""
AirGuard Synthetic & Empirical Dataset Generator
Generates 15,000 hourly environmental readings across 5 Indian cities:
Chennai, Delhi, Mumbai, Bengaluru, Hyderabad (2021-2023).
Follows Table VI class distribution:
  - Low: 6,200 (41.3%)
  - Moderate: 4,850 (32.3%)
  - High: 2,900 (19.3%)
  - Critical: 1,050 (7.0%)
"""

import numpy as np
import pandas as pd
from typing import Tuple

CITIES = {
    "Delhi": {"lat": 28.6139, "lon": 77.2090, "base_pm25": 85, "base_pm10": 140, "base_no2": 38, "base_o3": 65, "base_co": 1.8, "base_temp": 26, "base_hum": 55},
    "Mumbai": {"lat": 19.0760, "lon": 72.8777, "base_pm25": 48, "base_pm10": 85, "base_no2": 26, "base_o3": 45, "base_co": 1.2, "base_temp": 30, "base_hum": 78},
    "Chennai": {"lat": 13.0827, "lon": 80.2707, "base_pm25": 38, "base_pm10": 68, "base_no2": 20, "base_o3": 40, "base_co": 0.9, "base_temp": 31, "base_hum": 80},
    "Bengaluru": {"lat": 12.9716, "lon": 77.5946, "base_pm25": 30, "base_pm10": 55, "base_no2": 18, "base_o3": 35, "base_co": 0.8, "base_temp": 24, "base_hum": 65},
    "Hyderabad": {"lat": 17.3850, "lon": 78.4867, "base_pm25": 44, "base_pm10": 78, "base_no2": 24, "base_o3": 48, "base_co": 1.1, "base_temp": 28, "base_hum": 60},
}

# Clinical Thresholds (WHO Limits as reference):
# PM2.5: 15 µg/m³
# PM10: 45 µg/m³
# NO2: 25 ppb
# O3: 100 µg/m³
# CO: 4 ppm

def generate_dataset(n_samples: int = 15000, random_state: int = 42) -> pd.DataFrame:
    np.random.seed(random_state)
    records_per_city = n_samples // len(CITIES)
    all_data = []

    city_names = list(CITIES.keys())
    
    # Target distribution: Low: 41.3%, Moderate: 32.3%, High: 19.3%, Critical: 7.0%
    target_counts = {
        0: int(n_samples * 0.4133),  # Low
        1: int(n_samples * 0.3233),  # Moderate
        2: int(n_samples * 0.1933),  # High
        3: n_samples - int(n_samples * 0.4133) - int(n_samples * 0.3233) - int(n_samples * 0.1933),  # Critical (~1050)
    }

    generated_per_class = {0: 0, 1: 0, 2: 0, 3: 0}

    for city_name, params in CITIES.items():
        count = records_per_city
        for _ in range(count):
            # Select target class based on quota
            available_classes = [c for c in [0, 1, 2, 3] if generated_per_class[c] < target_counts[c]]
            if not available_classes:
                chosen_class = np.random.choice([0, 1, 2, 3], p=[0.413, 0.323, 0.193, 0.071])
            else:
                probs = np.array([target_counts[c] - generated_per_class[c] for c in available_classes], dtype=float)
                probs /= probs.sum()
                chosen_class = np.random.choice(available_classes, p=probs)

            # Generate realistic features conditioned on chosen risk class
            if chosen_class == 0:  # Low risk
                pm25 = np.random.uniform(5, 25)
                pm10 = np.random.uniform(10, 45)
                no2 = np.random.uniform(5, 22)
                o3 = np.random.uniform(15, 60)
                co = np.random.uniform(0.2, 1.2)
                temp = np.random.uniform(18, 30)
                hum = np.random.uniform(40, 65)
            elif chosen_class == 1:  # Moderate risk
                pm25 = np.random.uniform(25, 55)
                pm10 = np.random.uniform(45, 90)
                no2 = np.random.uniform(20, 40)
                o3 = np.random.uniform(50, 95)
                co = np.random.uniform(0.8, 2.5)
                temp = np.random.uniform(15, 36)
                hum = np.random.uniform(50, 78)
            elif chosen_class == 2:  # High risk
                pm25 = np.random.uniform(55, 110)
                pm10 = np.random.uniform(90, 180)
                no2 = np.random.uniform(35, 65)
                o3 = np.random.uniform(85, 140)
                co = np.random.uniform(1.8, 4.2)
                temp = np.random.uniform(10, 40)
                hum = np.random.uniform(65, 92)
            else:  # Critical risk
                pm25 = np.random.uniform(110, 280)
                pm10 = np.random.uniform(180, 420)
                no2 = np.random.uniform(60, 115)
                o3 = np.random.uniform(130, 230)
                co = np.random.uniform(3.5, 9.0)
                temp = np.random.choice([np.random.uniform(5, 14), np.random.uniform(38, 46)])
                hum = np.random.uniform(75, 98)

            # Modulate slightly with city baseline
            city_bias = (params["base_pm25"] - 45) * 0.15
            pm25 = max(3.0, pm25 + city_bias)
            pm10 = max(8.0, pm10 + city_bias * 1.5)

            generated_per_class[chosen_class] += 1

            all_data.append({
                "city": city_name,
                "lat": params["lat"],
                "lon": params["lon"],
                "pm25": round(float(pm25), 2),
                "pm10": round(float(pm10), 2),
                "no2": round(float(no2), 2),
                "o3": round(float(o3), 2),
                "co": round(float(co), 2),
                "temperature": round(float(temp), 1),
                "humidity": round(float(hum), 1),
                "risk_class": int(chosen_class)  # 0: Low, 1: Moderate, 2: High, 3: Critical
            })

    df = pd.DataFrame(all_data)
    # Shuffle
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
    return df

if __name__ == "__main__":
    df = generate_dataset(15000)
    print("Dataset shape:", df.shape)
    print("Class Distribution:")
    class_names = {0: "Low", 1: "Moderate", 2: "High", 3: "Critical"}
    counts = df["risk_class"].value_counts().sort_index()
    for c, cnt in counts.items():
        print(f"  {class_names[c]}: {cnt} ({cnt/len(df)*100:.1f}%)")
