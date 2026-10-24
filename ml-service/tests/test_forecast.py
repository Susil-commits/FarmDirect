import os
import sys
from pathlib import Path

# Ensure project root is present in sys.path for pytest module resolution
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("ML_SERVICE_KEY", "dev_ml_secret_key")

import json
import time
import hmac
import hashlib
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

SECRET_KEY = "dev_ml_secret_key"

def generate_hmac_headers(body: dict, timestamp: int = None, nonce: str = None, secret: str = SECRET_KEY):
    if timestamp is None:
        timestamp = int(time.time())
    if nonce is None:
        nonce = str(uuid.uuid4())
    body_str = json.dumps(body)
    message = f"{timestamp}.{nonce}.{body_str}".encode("utf-8")
    sig = "sha256=" + hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()
    return {
        "Content-Type": "application/json",
        "X-Signature": sig,
        "X-Timestamp": str(timestamp),
        "X-Nonce": nonce,
        "X-Correlation-Id": "test-corr-1234",
    }, body_str

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "farmdirect-ml-service"

def test_liveness_and_readiness():
    live_res = client.get("/health/live")
    assert live_res.status_code == 200
    assert live_res.json()["status"] == "ok"

    ready_res = client.get("/health/ready")
    assert ready_res.status_code == 200
    assert ready_res.json()["ready"] is True

def test_forecast_unauthorized():
    res = client.post("/forecast/price", json={
        "crop_name": "Tomato",
        "region": "Odisha",
        "history": [{"date": "2026-09-01", "price": 30.0}],
    })
    assert res.status_code == 401

def test_forecast_hmac_successful():
    history = [
        {"date": f"2026-08-{i:02d}", "price": 28.0 + (i % 5) * 1.5, "volume": 100.0}
        for i in range(1, 28)
    ]
    payload = {
        "crop_name": "Fresh Tomato",
        "region": "Odisha",
        "horizon_days": 14,
        "history": history,
    }
    headers, body_str = generate_hmac_headers(payload)
    res = client.post("/forecast/price", content=body_str, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["crop_name"] == "Fresh Tomato"
    assert data["region"] == "Odisha"
    assert len(data["forecast"]) == 14
    assert res.headers.get("X-Correlation-Id") == "test-corr-1234"

def test_forecast_hmac_tampered_body_rejected():
    payload = {
        "crop_name": "Fresh Tomato",
        "region": "Odisha",
        "horizon_days": 14,
        "history": [{"date": "2026-08-01", "price": 30.0}],
    }
    headers, _ = generate_hmac_headers(payload)
    tampered_body = json.dumps({"crop_name": "Attacker Tomato", "region": "Delhi", "horizon_days": 14, "history": []})
    res = client.post("/forecast/price", content=tampered_body, headers=headers)
    assert res.status_code == 401
    assert "Invalid X-Signature" in res.json()["detail"]

def test_forecast_hmac_expired_timestamp_rejected():
    payload = {
        "crop_name": "Fresh Tomato",
        "region": "Odisha",
        "horizon_days": 14,
        "history": [{"date": "2026-08-01", "price": 30.0}],
    }
    expired_time = int(time.time()) - 120  # 2 minutes ago
    headers, body_str = generate_hmac_headers(payload, timestamp=expired_time)
    res = client.post("/forecast/price", content=body_str, headers=headers)
    assert res.status_code == 401
    assert "tolerance window" in res.json()["detail"]

def test_forecast_legacy_api_key_successful():
    history = [
        {"date": f"2026-08-{i:02d}", "price": 28.0 + (i % 5) * 1.5, "volume": 100.0}
        for i in range(1, 28)
    ]
    res = client.post(
        "/forecast/price",
        headers={"X-ML-Service-Key": "dev_ml_secret_key"},
        json={
            "crop_name": "Fresh Tomato",
            "region": "Odisha",
            "horizon_days": 14,
            "history": history,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["crop_name"] == "Fresh Tomato"
    assert len(data["forecast"]) == 14

def test_anomaly_scoring_hmac():
    payload = {
        "unit_price": 120.0,
        "market_median": 30.0,
        "quantity": 500.0,
        "typical_quantity": 25.0,
        "buyer_age_days": 0.5,
        "orders_last_hour": 4,
        "is_cod": True,
        "buyer_cancellation_rate": 0.55,
        "discount_pct": 0.0,
    }
    headers, body_str = generate_hmac_headers(payload)
    res = client.post("/anomaly/score", content=body_str, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_anomaly"] is True
    assert data["anomaly_score"] >= 0.5
    assert len(data["reasons"]) > 0

def test_forecast_model_caching():
    history = [
        {"date": f"2026-08-{i:02d}", "price": 30.0 + (i % 4) * 2.0, "volume": 120.0}
        for i in range(1, 30)
    ]
    payload = {
        "crop_name": "Cached Potato",
        "region": "Punjab",
        "horizon_days": 14,
        "history": history,
    }
    headers1, body1 = generate_hmac_headers(payload)
    res1 = client.post("/forecast/price", content=body1, headers=headers1)
    assert res1.status_code == 200

    # Second call should hit the in-memory model cache
    headers2, body2 = generate_hmac_headers(payload)
    res2 = client.post("/forecast/price", content=body2, headers=headers2)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["model_used"] == "Cached-GradientBoost-Regressor"

def test_anomaly_scoring_normal_order():
    payload = {
        "unit_price": 32.0,
        "market_median": 30.0,
        "quantity": 20.0,
        "typical_quantity": 25.0,
        "buyer_age_days": 45.0,
        "orders_last_hour": 1,
        "is_cod": False,
        "buyer_cancellation_rate": 0.05,
        "discount_pct": 5.0,
    }
    headers, body_str = generate_hmac_headers(payload)
    res = client.post("/anomaly/score", content=body_str, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_anomaly"] is False
    assert data["anomaly_score"] < 0.50
    assert len(data["reasons"]) == 0

