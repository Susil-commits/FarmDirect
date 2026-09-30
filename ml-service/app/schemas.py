from typing import List, Optional
from pydantic import BaseModel, Field

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "farmdirect-ml-service"
    version: str = "1.0.0"

class PriceHistoryPoint(BaseModel):
    date: str
    price: float
    volume: Optional[float] = None

class PriceForecastPoint(BaseModel):
    date: str
    p10: float
    p50: float
    p90: float

class PriceForecastRequest(BaseModel):
    crop_name: str = Field(..., description="Crop name, e.g., Tomato, Potato")
    category: Optional[str] = Field(None, description="Category, e.g., vegetables, fruits")
    region: str = Field(..., description="Target region or market state/district")
    history: List[PriceHistoryPoint] = Field(..., description="Historical price observations")
    horizon_days: int = Field(default=14, ge=1, le=90, description="Forecast horizon in days")

class PriceForecastResponse(BaseModel):
    crop_name: str
    region: str
    horizon_days: int
    model_used: str
    beats_baseline: bool
    baseline_mape: float
    model_mape: float
    confidence: float
    forecast: List[PriceForecastPoint]
    recommendation: str

class AnomalyScoreRequest(BaseModel):
    order_id: Optional[str] = None
    unit_price: float
    market_median: float
    quantity: float
    typical_quantity: float
    buyer_age_days: float
    orders_last_hour: int
    is_cod: bool
    buyer_cancellation_rate: float
    discount_pct: float

class AnomalyScoreResponse(BaseModel):
    anomaly_score: float
    is_anomaly: bool
    reasons: List[str]
