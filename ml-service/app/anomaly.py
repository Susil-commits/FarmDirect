import numpy as np
from typing import List, Tuple
from sklearn.ensemble import IsolationForest
from .schemas import AnomalyScoreRequest, AnomalyScoreResponse

# Initialize and train a baseline Isolation Forest on typical agricultural commerce profiles
# Features: [price_ratio, qty_ratio, velocity, new_account, cod_cancellation_rate, discount_rate]
def _build_calibrated_isolation_forest() -> IsolationForest:
    rng = np.random.RandomState(42)
    
    # 500 normal marketplace order distributions
    n_samples = 500
    norm_price_ratio = rng.normal(loc=1.0, scale=0.18, size=(n_samples, 1))
    norm_qty_ratio = rng.normal(loc=1.0, scale=0.35, size=(n_samples, 1))
    norm_velocity = rng.poisson(lam=0.4, size=(n_samples, 1)).astype(float)
    norm_new_account = rng.choice([0.0, 0.5, 1.0], p=[0.75, 0.15, 0.10], size=(n_samples, 1))
    norm_cancellation = rng.beta(a=1, b=8, size=(n_samples, 1))
    norm_discount = rng.uniform(0.0, 0.25, size=(n_samples, 1))

    normal_data = np.hstack([
        np.clip(norm_price_ratio, 0.4, 1.8),
        np.clip(norm_qty_ratio, 0.2, 2.5),
        norm_velocity,
        norm_new_account,
        norm_cancellation,
        norm_discount,
    ])

    # 40 synthetic anomalies (outliers)
    anom_price = rng.choice([0.2, 3.0, 4.5], size=(40, 1))
    anom_qty = rng.choice([5.0, 8.0, 12.0], size=(40, 1))
    anom_velocity = rng.choice([4.0, 6.0, 10.0], size=(40, 1))
    anom_new_account = np.ones((40, 1))
    anom_cancellation = rng.uniform(0.5, 0.9, size=(40, 1))
    anom_discount = rng.uniform(0.6, 0.9, size=(40, 1))

    outlier_data = np.hstack([
        anom_price,
        anom_qty,
        anom_velocity,
        anom_new_account,
        anom_cancellation,
        anom_discount,
    ])

    training_data = np.vstack([normal_data, outlier_data])

    forest = IsolationForest(
        n_estimators=100,
        contamination=0.08,
        random_state=42,
        n_jobs=-1,
    )
    forest.fit(training_data)
    return forest

_ISOLATION_FOREST = _build_calibrated_isolation_forest()

def score_transaction_anomaly(request: AnomalyScoreRequest) -> AnomalyScoreResponse:
    reasons: List[str] = []
    rule_score = 0.0

    # 1. Feature Extraction & Normalization
    price_ratio = (
        request.unit_price / request.market_median
        if request.market_median > 0
        else 1.0
    )
    qty_ratio = (
        request.quantity / request.typical_quantity
        if request.typical_quantity > 0
        else 1.0
    )
    velocity = float(request.orders_last_hour)
    is_brand_new = 1.0 if request.buyer_age_days < 1.0 else (0.5 if request.buyer_age_days < 7.0 else 0.0)
    cod_risk = request.buyer_cancellation_rate if request.is_cod else 0.0
    discount_rate = request.discount_pct / 100.0

    # 2. Explainable Rule-Based Verification
    if request.market_median > 0:
        if price_ratio > 2.5:
            reasons.append(f"Price is {price_ratio:.1f}x higher than market median (₹{request.market_median})")
            rule_score += 0.35
        elif price_ratio < 0.35:
            reasons.append(f"Price is heavily discounted ({price_ratio:.1f}x market median)")
            rule_score += 0.25

    if request.typical_quantity > 0 and qty_ratio > 3.5:
        reasons.append(f"Bulk order quantity {request.quantity} is {qty_ratio:.1f}x above average")
        rule_score += 0.25

    if request.buyer_age_days < 1.0 and request.orders_last_hour >= 3:
        reasons.append(f"Rapid order velocity ({request.orders_last_hour} orders in first 24h)")
        rule_score += 0.30

    if request.is_cod and request.buyer_cancellation_rate > 0.35:
        reasons.append(
            f"High risk COD buyer with {request.buyer_cancellation_rate * 100:.0f}% historical cancellations"
        )
        rule_score += 0.25

    if request.discount_pct >= 55.0:
        reasons.append(f"Suspiciously high discount ({request.discount_pct:.0f}%) applied")
        rule_score += 0.25

    # 3. Unsupervised Isolation Forest Inference
    feature_vector = np.array([[
        price_ratio,
        qty_ratio,
        velocity,
        is_brand_new,
        cod_risk,
        discount_rate,
    ]])

    # decision_function yields negative values for anomalies, positive for normal observations
    raw_decision = _ISOLATION_FOREST.decision_function(feature_vector)[0]
    # Map decision function from [-0.5, 0.5] range to [0.0, 1.0] anomaly probability
    forest_anomaly_prob = float(np.clip(0.5 - raw_decision * 1.8, 0.0, 1.0))

    # 4. Hybrid Fusion (Rule Score + Isolation Forest)
    if rule_score > 0:
        # If specific rules were breached, blend rule score and model score
        final_score = 0.55 * rule_score + 0.45 * forest_anomaly_prob
    else:
        # If no explicit rules were triggered, rely on unsupervised outlier detection
        final_score = forest_anomaly_prob * 0.70

    final_score = round(float(np.clip(final_score, 0.0, 1.0)), 2)
    is_anomaly = final_score >= 0.50

    return AnomalyScoreResponse(
        anomaly_score=final_score,
        is_anomaly=is_anomaly,
        reasons=reasons,
    )
