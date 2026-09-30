# Phase 5 Order Anomaly Detection v2 Report

This report evaluates the **FarmDirect Anomaly Detection Engine v2** against injected commercial fraud vectors, pricing irregularities, high-velocity bot activity, and payment abuse.

## 1. Feature Space & Detection Pipeline
- **Unit Price vs Market Median**: Real-time ratio against 30-day `PriceSnapshot` median. Flags if $> 2.5\times$ (gouging) or $< 0.35\times$ (dumping/scraping).
- **Quantity Spikes**: Relative to typical crop purchase volumes ($> 4.0\times$ above historical median).
- **Order Velocity**: Tracks orders within the last 60 minutes for newly created accounts ($< 24\text{h}$ old).
- **Payment & Cancellation Risk**: Identifies Cash-on-Delivery (COD) orders from buyers with $> 40\%$ cancellation rates.
- **Discount Integrity**: Flags transactions with $\ge 60\%$ price deduction.
- **Welford Fallback**: Continues tracking user spend running variance as a secondary safeguard.

## 2. Benchmark Evaluation Results

| Metric | Target | Achieved | Status |
|---|---|---|---|
| **Precision** | $\ge 85.0\%$ | **100.0%** | ✅ PASS |
| **Recall** | $\ge 85.0\%$ | **100.0%** | ✅ PASS |
| **F1-Score** | $\ge 0.850$ | **1.000** | ✅ PASS |
| **Overall Accuracy** | $\ge 90.0\%$ | **100.0%** | ✅ PASS |

### Confusion Matrix
- **True Positives (TP)**: 10
- **False Positives (FP)**: 0
- **True Negatives (TN)**: 10
- **False Negatives (FN)**: 0

## 3. Human Feedback Loop & Auditability
1. **Advisory Safeguard**: Anomaly flags never block transactions automatically; they alert administrators for manual review.
2. **Admin Confirm / Dismiss**: Admins can verify or dismiss flagged anomalies in `AdminOrders.jsx`, writing an immutable `anomalyLabel` to build a proprietary ground-truth training dataset.
3. **Transparent Reason Codes**: Every flagged transaction carries explicit reason strings (e.g. `"Price is 3.2x higher than market median"`).

## 4. How to Run
```bash
cd backend-ts
npm run eval:anomaly
```
