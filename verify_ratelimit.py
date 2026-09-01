"""
Verification Script for AirGuard Rate Limiting
Tests:
1. FastApi Backend:
   - General endpoint allows normal requests (within 100 limit) and sets headers.
   - Login route (/api/auth/login):
     - Attempts 1 to 5 succeed (or return 401 for bad credentials) and decrement remaining attempts.
     - Attempt 6 returns HTTP 429 Too Many Requests with Retry-After and X-RateLimit headers.
2. Simulated Next.js sliding window rate limiter:
   - Max 5 attempts per 15 min on login.
   - Attempt 6 returns 429 with retry-after.
"""

import sys
import os
import time
from fastapi.testclient import TestClient

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))
from backend.main import app, RATE_LIMIT_STORE

def test_fastapi_rate_limiting():
    print("=== [1/2] Testing FastAPI Backend Rate Limiting ===")
    RATE_LIMIT_STORE.clear()
    client = TestClient(app)

    # 1. Test general endpoint (e.g. /api/history)
    resp = client.get("/api/history?city=Bengaluru&days=1")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    assert "X-RateLimit-Limit" in resp.headers, "Missing X-RateLimit-Limit header"
    assert resp.headers["X-RateLimit-Limit"] == "100", f"Expected limit 100, got {resp.headers['X-RateLimit-Limit']}"
    assert "X-RateLimit-Remaining" in resp.headers, "Missing X-RateLimit-Remaining header"
    print(f"[OK] General endpoint responded: 200 OK | Remaining: {resp.headers['X-RateLimit-Remaining']}")

    # 2. Test login endpoint rate limit: 5 attempts per 15 min
    client_ip = "192.168.1.50"
    headers = {"x-forwarded-for": client_ip}

    print("\nAttempting 5 logins from IP:", client_ip)
    for i in range(1, 6):
        res = client.post(
            "/api/auth/login",
            json={"email": "wrong@example.com", "password": "badpassword"},
            headers=headers
        )
        assert res.status_code == 401, f"Attempt {i}: expected 401, got {res.status_code}"
        rem = res.headers.get("X-RateLimit-Remaining")
        lim = res.headers.get("X-RateLimit-Limit")
        print(f"[OK] Attempt {i}/5: status {res.status_code} | Limit={lim} | Remaining={rem}")
        assert lim == "5", f"Expected login limit 5, got {lim}"
        assert int(rem) == 5 - i, f"Expected remaining {5 - i}, got {rem}"

    # 3. Attempt 6 should be blocked by Rate Limiter with 429
    print("\nAttempting 6th login (should be blocked with 429):")
    res6 = client.post(
        "/api/auth/login",
        json={"email": "demo@airguard.app", "password": "demo1234"},
        headers=headers
    )
    print(f"Attempt 6 status: {res6.status_code}")
    print(f"Attempt 6 body: {res6.json()}")
    print(f"Attempt 6 headers: Retry-After={res6.headers.get('Retry-After')}, Limit={res6.headers.get('X-RateLimit-Limit')}, Remaining={res6.headers.get('X-RateLimit-Remaining')}")

    assert res6.status_code == 429, f"Expected 429 Too Many Requests, got {res6.status_code}"
    data = res6.json()
    assert "detail" in data, "Missing detail in 429 response"
    assert "Too many login attempts" in data["detail"]
    assert "Retry-After" in res6.headers, "Missing Retry-After header"
    assert int(res6.headers["Retry-After"]) > 0
    print("[OK] 6th login attempt successfully blocked by rate limiter with HTTP 429!")

    # 4. A different IP should still be allowed
    other_ip_res = client.post(
        "/api/auth/login",
        json={"email": "demo@airguard.app", "password": "demo1234"},
        headers={"x-forwarded-for": "10.0.0.99"}
    )
    assert other_ip_res.status_code == 200, f"Other IP should be allowed, got {other_ip_res.status_code}"
    print("[OK] Different IP successfully logged in without being affected by the blocked IP.")


def test_nextjs_ratelimit_logic():
    print("\n=== [2/2] Testing Next.js Rate Limiter Model Logic ===")
    # Simulate the exact logic in lib/rateLimit.ts
    store = {}
    LOGIN_LIMIT = 5
    LOGIN_WINDOW_S = 15 * 60

    def check(key, limit, window_s):
        now = time.time()
        window_start = now - window_s
        ts = [t for t in store.get(key, []) if t > window_start]
        if len(ts) >= limit:
            retry_after = max(1, int(ts[0] + window_s - now))
            return False, 0, retry_after
        ts.append(now)
        store[key] = ts
        return True, limit - len(ts), 0

    key = "login:client_next_123"
    for i in range(1, 6):
        ok, rem, _ = check(key, LOGIN_LIMIT, LOGIN_WINDOW_S)
        assert ok is True
        assert rem == 5 - i

    ok, rem, retry_after = check(key, LOGIN_LIMIT, LOGIN_WINDOW_S)
    assert ok is False
    assert rem == 0
    assert 890 <= retry_after <= 900
    print(f"[OK] Next.js rate limiting logic validated: 5 allowed, 6th rejected with retry-after {retry_after}s.")

if __name__ == "__main__":
    test_fastapi_rate_limiting()
    test_nextjs_ratelimit_logic()
    print("\n=======================================================")
    print("ALL RATE LIMITING TESTS PASSED (MAX 5 / 15 MIN ON LOGIN)")
    print("=======================================================")
