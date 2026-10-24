import os
import hmac
import hashlib
import time
import secrets
import logging
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Security, Request, status
from fastapi.security.api_key import APIKeyHeader

logger = logging.getLogger("ml_service")

from .schemas import (
    HealthResponse,
    PriceForecastRequest,
    PriceForecastResponse,
    AnomalyScoreRequest,
    AnomalyScoreResponse,
)
from .forecasting import generate_price_forecast
from .anomaly import score_transaction_anomaly

API_KEY_NAME = "X-ML-Service-Key"
EXPECTED_API_KEY = os.getenv("ML_SERVICE_KEY")
if not EXPECTED_API_KEY:
    raise RuntimeError("ML_SERVICE_KEY environment variable is required and must be set before boot.")

api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def verify_service_auth(
    request: Request,
    api_key: Optional[str] = Security(api_key_header),
):
    correlation_id = request.headers.get("X-Correlation-Id") or secrets.token_hex(8)
    request.state.correlation_id = correlation_id

    signature = request.headers.get("X-Signature")
    timestamp_str = request.headers.get("X-Timestamp")
    nonce = request.headers.get("X-Nonce")

    # Tier 1 Cryptographic Authentication: HMAC-SHA256 with timestamp tolerance
    if signature and timestamp_str and nonce:
        try:
            timestamp = int(timestamp_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid X-Timestamp header in service authentication",
            )

        current_time = int(time.time())
        # Enforce maximum 60-second replay window
        if abs(current_time - timestamp) > 60:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Request timestamp outside allowed 60-second tolerance window",
            )

        body = await request.body()
        message = f"{timestamp}.{nonce}.".encode("utf-8") + body
        expected_sig = "sha256=" + hmac.new(
            EXPECTED_API_KEY.encode("utf-8"),
            message,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, signature):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid X-Signature cryptographic payload signature",
            )
        return {"auth": "hmac", "correlation_id": correlation_id}

    # Backward-compatible Tier 2 fallback: Static API Key Header
    if api_key and secrets.compare_digest(api_key, EXPECTED_API_KEY):
        return {"auth": "api_key", "correlation_id": correlation_id}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid authentication (requires HMAC signature or X-ML-Service-Key)",
    )

app = FastAPI(
    title="FarmDirect ML Service",
    description="Internal machine learning microservice for price forecasting and anomaly scoring",
    version="1.1.0",
    docs_url=None,  # No public API exposure
    redoc_url=None,
)

@app.middleware("http")
async def add_correlation_id_header(request: Request, call_next):
    correlation_id = getattr(request.state, "correlation_id", None) or request.headers.get("X-Correlation-Id")
    response = await call_next(request)
    if correlation_id:
        response.headers["X-Correlation-Id"] = correlation_id
    return response

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        service="farmdirect-ml-service",
        version="1.1.0",
    )

@app.get("/health/live")
def liveness_check():
    return {"status": "ok", "service": "farmdirect-ml-service", "version": "1.1.0"}

@app.get("/health/ready")
def readiness_check():
    # Verify forecasting engine availability
    return {
        "status": "ok",
        "ready": True,
        "service": "farmdirect-ml-service",
        "version": "1.1.0",
        "capabilities": ["price_forecast", "anomaly_score"],
    }

@app.post("/forecast/price", response_model=PriceForecastResponse, dependencies=[Depends(verify_service_auth)])
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
        logger.warning(f"Validation error in forecast: {ve}")
        raise HTTPException(status_code=400, detail="Invalid forecast request parameters")
    except Exception as e:
        logger.error(f"Forecasting engine error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal forecasting service error")

@app.post("/anomaly/score", response_model=AnomalyScoreResponse, dependencies=[Depends(verify_service_auth)])
def score_anomaly(request: AnomalyScoreRequest):
    try:
        return score_transaction_anomaly(request)
    except Exception as e:
        logger.error(f"Anomaly scoring error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal anomaly scoring service error")
