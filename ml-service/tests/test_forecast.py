import os
import sys
from pathlib import Path

# Ensure project root is present in sys.path for pytest module resolution
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

os.environ.setdefault("ML_SERVICE_KEY", "dev_ml_secret_key")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "farmdirect-ml-service"

def test_forecast_unauthorized():
    res = client.post("/forecast/price", json={
        "crop_name": "Tomato",
        "region": "Odisha",
        "history": [{"date": "2026-09-01", "price": 30.0}],
    })
    assert res.status_code == 401

def test_forecast_successful():
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
    assert data["region"] == "Odisha"
    assert len(data["forecast"]) == 14
    assert "p10" in data["forecast"][0]
    assert "p50" in data["forecast"][0]
    assert "p90" in data["forecast"][0]
    assert data["forecast"][0]["p10"] <= data["forecast"][0]["p90"]
    assert "recommendation" in data
    assert "beats_baseline" in data

def test_anomaly_scoring():
    res = client.post(
        "/anomaly/score",
        headers={"X-ML-Service-Key": "dev_ml_secret_key"},
        json={
            "unit_price": 120.0,
            "market_median": 30.0,
            "quantity": 500.0,
            "typical_quantity": 25.0,
            "buyer_age_days": 0.5,
            "orders_last_hour": 4,
            "is_cod": True,
            "buyer_cancellation_rate": 0.55,
            "discount_pct": 0.0,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_anomaly"] is True
    assert data["anomaly_score"] >= 0.5
    assert len(data["reasons"]) > 0
