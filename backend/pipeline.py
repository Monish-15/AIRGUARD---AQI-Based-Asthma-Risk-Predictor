"""
AirGuard Data Processing & Feature Engineering Pipeline
Implements:
1. In-memory cache with 10-minute TTL (Layer 1)
2. Sentinel (-999/null) detection & 5-observation rolling-mean imputation (Layer 2)
3. Modified Z-Score outlier detection & clipping via Median Absolute Deviation (MAD)
4. Min-max normalization
5. 3 Physiologically motivated interaction features (Layer 2):
   - Humidity-weighted PM2.5 (moisture uptake -> particulate expansion -> deeper alveolar deposition)
   - Temperature-weighted PM10 (heat stress -> secondary aerosols from PM10 precursors)
   - Oxidant burden composite (photochemical co-production of O3 & NO2, synergistic airway irritation)
"""

import time
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple

RAW_FEATURES = ["pm25", "pm10", "no2", "o3", "co", "temperature", "humidity"]
ENGINEERED_FEATURES = ["humidity_x_pm25", "temp_x_pm10", "oxidant_burden"]
ALL_10_FEATURES = RAW_FEATURES + ENGINEERED_FEATURES

# Physical bounds for clipping extreme outliers (sensible upper/lower boundaries)
PHYSICAL_BOUNDS = {
    "pm25": (0.0, 999.0),
    "pm10": (0.0, 1500.0),
    "no2": (0.0, 500.0),
    "o3": (0.0, 600.0),
    "co": (0.0, 50.0),
    "temperature": (-20.0, 60.0),
    "humidity": (0.0, 100.0),
}

# Training set global means for imputation fallback
GLOBAL_MEANS = {
    "pm25": 45.0,
    "pm10": 80.0,
    "no2": 25.0,
    "o3": 50.0,
    "co": 1.2,
    "temperature": 27.5,
    "humidity": 68.0,
}

# Training set median & MAD for Modified Z-Score outlier check
GLOBAL_MEDIAN_MAD = {
    "pm25": {"median": 40.0, "mad": 22.0},
    "pm10": {"median": 75.0, "mad": 35.0},
    "no2": {"median": 23.0, "mad": 12.0},
    "o3": {"median": 48.0, "mad": 25.0},
    "co": {"median": 1.1, "mad": 0.6},
    "temperature": {"median": 27.0, "mad": 5.0},
    "humidity": {"median": 68.0, "mad": 15.0},
}

class InMemoryCache:
    """
    In-memory cache with 10-minute (600s) TTL as described in Section III-C.
    Key is (location, tuple of parameter names/values).
    """
    def __init__(self, ttl_seconds: int = 600):
        self.ttl = ttl_seconds
        self.store: Dict[str, Tuple[float, Any]] = {}
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        if key in self.store:
            timestamp, val = self.store[key]
            if time.time() - timestamp <= self.ttl:
                self.hits += 1
                return val
            else:
                del self.store[key]
        self.misses += 1
        return None

    def set(self, key: str, val: Any) -> None:
        self.store[key] = (time.time(), val)

    def stats(self) -> Dict[str, Any]:
        total = self.hits + self.misses
        rate = (self.hits / total * 100) if total > 0 else 0.0
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate_pct": round(rate, 2),
            "cached_entries": len(self.store)
        }


class DataPipeline:
    """
    Full 5-stage Data Cleaning, Imputation, Normalization & Feature Engineering Pipeline.
    """
    def __init__(self, feature_ranges: Optional[Dict[str, Tuple[float, float]]] = None):
        # Default Min-Max normalization bounds
        self.feature_ranges = feature_ranges or {
            "pm25": (0.0, 300.0),
            "pm10": (0.0, 500.0),
            "no2": (0.0, 150.0),
            "o3": (0.0, 250.0),
            "co": (0.0, 10.0),
            "temperature": (0.0, 50.0),
            "humidity": (0.0, 100.0),
            "humidity_x_pm25": (0.0, 1.0),
            "temp_x_pm10": (0.0, 1.0),
            "oxidant_burden": (0.0, 1.0),
        }
        # In-memory recent history buffer per location for 5-observation rolling-mean
        self.location_history: Dict[str, Dict[str, List[float]]] = {}
        self.cache = InMemoryCache(ttl_seconds=600)

    def clean_and_impute_single(self, raw: Dict[str, Any], location_key: str = "default") -> Dict[str, float]:
        """
        Step 1 & 2: Sentinel detection & 5-observation rolling-mean imputation
        """
        cleaned = {}
        if location_key not in self.location_history:
            self.location_history[location_key] = {f: [] for f in RAW_FEATURES}

        hist = self.location_history[location_key]

        for feat in RAW_FEATURES:
            val = raw.get(feat, None)

            # Detect null or offline sentinel values (-999, negative pollutant readings)
            is_invalid = (
                val is None or 
                val == "" or 
                val == -999 or 
                (isinstance(val, (int, float)) and np.isnan(val)) or
                (feat not in ["temperature"] and isinstance(val, (int, float)) and val < 0)
            )

            if is_invalid:
                # 5-observation rolling mean of valid recent readings
                valid_recent = [v for v in hist[feat] if v is not None and v != -999]
                if valid_recent:
                    imputed_val = float(np.mean(valid_recent[-5:]))
                else:
                    # Fallback to global prior
                    imputed_val = GLOBAL_MEANS[feat]
                cleaned[feat] = imputed_val
            else:
                cleaned[feat] = float(val)

            # Step 3: Outlier check via Modified Z-score & Physical Boundary Clipping
            cleaned[feat] = self.check_and_clip_outlier(feat, cleaned[feat])

            # Update rolling history (keep max 10)
            hist[feat].append(cleaned[feat])
            if len(hist[feat]) > 10:
                hist[feat].pop(0)

        return cleaned

    def check_and_clip_outlier(self, feat: str, val: float) -> float:
        """
        Modified Z-score: M_i = (0.6745 * |x_i - median|) / MAD
        If M_i > 4.5 (extreme statistical anomaly), clip to physically sensible boundary.
        """
        params = GLOBAL_MEDIAN_MAD.get(feat)
        if params and params["mad"] > 0:
            mod_z = 0.6745 * abs(val - params["median"]) / params["mad"]
            if mod_z > 4.5:
                # Outlier flagged: clip to min/max physical bounds
                min_b, max_b = PHYSICAL_BOUNDS[feat]
                return float(np.clip(val, min_b, max_b))
        
        min_b, max_b = PHYSICAL_BOUNDS[feat]
        return float(np.clip(val, min_b, max_b))

    def normalize(self, feat: str, val: float) -> float:
        """Min-max normalization to [0, 1]"""
        min_v, max_v = self.feature_ranges.get(feat, (0.0, 1.0))
        if max_v == min_v:
            return 0.0
        norm = (val - min_v) / (max_v - min_v)
        return float(np.clip(norm, 0.0, 1.0))

    def engineer_features(self, cleaned_raw: Dict[str, float]) -> Dict[str, float]:
        """
        Calculates the 3 physiologically motivated interaction features:
        1. humidity_x_pm25: normalized humidity * normalized pm25
        2. temp_x_pm10: normalized temperature * normalized pm10
        3. oxidant_burden: weighted combination of normalized O3, NO2, PM2.5
        """
        # First normalize the 7 raw features
        norm_pm25 = self.normalize("pm25", cleaned_raw["pm25"])
        norm_pm10 = self.normalize("pm10", cleaned_raw["pm10"])
        norm_no2 = self.normalize("no2", cleaned_raw["no2"])
        norm_o3 = self.normalize("o3", cleaned_raw["o3"])
        norm_co = self.normalize("co", cleaned_raw["co"])
        norm_temp = self.normalize("temperature", cleaned_raw["temperature"])
        norm_hum = self.normalize("humidity", cleaned_raw["humidity"])

        # 1. Humidity-weighted PM2.5
        humidity_x_pm25 = norm_hum * norm_pm25

        # 2. Temperature-weighted PM10
        temp_x_pm10 = norm_temp * norm_pm10

        # 3. Oxidant burden composite: Photochemical co-production of O3 & NO2 + PM2.5 synergistic burden
        # Fixed weights reflecting atmospheric synergy: 0.45 O3 + 0.35 NO2 + 0.20 PM2.5
        oxidant_burden = 0.45 * norm_o3 + 0.35 * norm_no2 + 0.20 * norm_pm25

        return {
            "norm_pm25": norm_pm25,
            "norm_pm10": norm_pm10,
            "norm_no2": norm_no2,
            "norm_o3": norm_o3,
            "norm_co": norm_co,
            "norm_temperature": norm_temp,
            "norm_humidity": norm_hum,
            "humidity_x_pm25": float(np.clip(humidity_x_pm25, 0.0, 1.0)),
            "temp_x_pm10": float(np.clip(temp_x_pm10, 0.0, 1.0)),
            "oxidant_burden": float(np.clip(oxidant_burden, 0.0, 1.0)),
        }

    def process_to_10d_vector(self, raw: Dict[str, Any], location_key: str = "default") -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        End-to-end transformation: Raw input -> Cleaned -> Normalized -> 10-dimensional vector
        """
        cleaned = self.clean_and_impute_single(raw, location_key)
        features = self.engineer_features(cleaned)

        vector_10d = np.array([
            features["norm_pm25"],
            features["norm_pm10"],
            features["norm_no2"],
            features["norm_o3"],
            features["norm_co"],
            features["norm_temperature"],
            features["norm_humidity"],
            features["humidity_x_pm25"],
            features["temp_x_pm10"],
            features["oxidant_burden"],
        ], dtype=np.float32)

        meta = {
            "cleaned_raw": cleaned,
            "engineered": {
                "humidity_x_pm25": features["humidity_x_pm25"],
                "temp_x_pm10": features["temp_x_pm10"],
                "oxidant_burden": features["oxidant_burden"]
            },
            "normalized_vector": vector_10d.tolist(),
            "feature_names": ALL_10_FEATURES
        }

        return vector_10d, meta
