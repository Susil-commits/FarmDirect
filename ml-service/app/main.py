import os
from fastapi import FastAPI, Depends, HTTPException, Security, status
from fastapi.security.api_key import APIKeyHeader

from .schemas import (
    HealthResponse,
    PriceForecastRequest,
    PriceForecastResponse,
    AnomalyScoreRequest,
    AnomalyScoreResponse,
)
from .forecasting import generate_price_forecast

API_KEY_NAME = "X-ML-Service-Key"
EXPECTED_API_KEY = os.getenv("ML_SERVICE_KEY")
if not EXPECTED_API_KEY:
    raise RuntimeError("ML_SERVICE_KEY environment variable is required and must be set before boot.")

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def verify_api_key(api_key: str = Security(api_key_header)):
    if not api_key or api_key != EXPECTED_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-ML-Service-Key authentication header",
        )
    return api_key

app = FastAPI(
    title="FarmDirect ML Service",
    description="Internal machine learning microservice for price forecasting and anomaly scoring",
    version="1.0.0",
    docs_url=None,  # No public API exposure
    redoc_url=None,
)

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        service="farmdirect-ml-service",
        version="1.0.0",
    )

@app.post("/forecast/price", response_model=PriceForecastResponse, dependencies=[Depends(verify_api_key)])
def forecast_price(request: PriceForecastRequest):
    try:
        response = generate_price_forecast(
            crop_name=request.crop_name,
            region=request.region,
            history=request.history,
            horizon_days=request.horizon_days,
            category=request.category or "vegetables",
        )
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting engine error: {str(e)}")

@app.post("/anomaly/score", response_model=AnomalyScoreResponse, dependencies=[Depends(verify_api_key)])
def score_anomaly(request: AnomalyScoreRequest):
    reasons = []
    anomaly_score = 0.0

    # 1. Price deviation vs market median
    if request.market_median > 0:
        ratio = request.unit_price / request.market_median
        if ratio > 2.5:
            reasons.append(f"Price is {ratio:.1f}x higher than market median (₹{request.market_median})")
            anomaly_score += 0.35
        elif ratio < 0.35:
            reasons.append(f"Price is heavily discounted ({ratio:.1f}x market median)")
            anomaly_score += 0.25

    # 2. Unusual quantity spikes
    if request.typical_quantity > 0:
        q_ratio = request.quantity / request.typical_quantity
        if q_ratio > 4.0:
            reasons.append(f"Bulk order quantity {request.quantity} is {q_ratio:.1f}x above average")
            anomaly_score += 0.25

    # 3. High order velocity for brand new accounts
    if request.buyer_age_days < 1.0 and request.orders_last_hour >= 3:
        reasons.append(f"Rapid order velocity ({request.orders_last_hour} orders in first 24h)")
        anomaly_score += 0.30

    # 4. COD high risk buyer cancellation rate
    if request.is_cod and request.buyer_cancellation_rate > 0.40:
        reasons.append(f"High risk COD buyer with {request.buyer_cancellation_rate * 100:.0f}% historical cancellations")
        anomaly_score += 0.20

    is_anomaly = anomaly_score >= 0.50
    return AnomalyScoreResponse(
        anomaly_score=round(min(1.0, anomaly_score), 2),
        is_anomaly=is_anomaly,
        reasons=reasons,
    )
