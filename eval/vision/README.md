# Phase 2 Vision & Smart Listing Evaluation

This directory contains the labeled benchmark dataset, evaluation runner, and test results for **FarmDirect Phase 2 (Smart Listing: multimodal + price guidance)**.

## 1. Dataset Specification (`dataset.json`)
- **Total Test Cases**: 100
- **Produce Variety Samples**: 85
  - Indian Vegetables: Tomato, Potato, Onion, Brinjal, Cabbage, Cauliflower, Okra, Carrot, Spinach, Radish, Capsicum, Green Pea, Gourds, Garlic, Beetroot, etc.
  - Indian Fruits: Alphonso Mango, Robusta Banana, Apple, Papaya, Guava, Orange, Watermelon, Pomegranate, Grapes, Pineapple, Coconut, etc.
  - Grains & Pulses: Basmati Rice, Sharbati Wheat, Maize, Ragi, Bajra, Jowar, Moong Dal, Chana Dal, Toor Dal, Urad Dal, Masoor Dal, Rajma.
  - Spices & Herbs: Green Chilli, Ginger, Turmeric, Black Pepper, Cumin, Coriander Seeds, Cardamom, Mustard, Fenugreek, Mint, Curry Leaves.
- **Sanity Check (Non-Produce / Distorted) Samples**: 15
  - Invoices, store receipts, driving licenses, trucks, tractors, human portraits, watermarked stock photos, blurry images, blank frames, machinery parts.

## 2. Evaluation Results
| Metric | Target | Measured | Result |
|---|---|---|---|
| **Produce Top-1 Identification Accuracy** | ≥ 90.0% | **100.0%** (85/85) | **PASS** |
| **Sanity Signal Accuracy (`looksLikeProduce`)** | ≥ 95.0% | **100.0%** (100/100) | **PASS** |
| **Overall Suite Pass Rate** | ≥ 90.0% | **100.0%** (100/100) | **PASS** |
| **Execution Duration** | < 10.0s | **9.56s** | **PASS** |

## 3. Advisory Safeguards & Human Override Verification
1. **Never Auto-Submits**: Suggested fields (`cropName`, `category`, `cropType`, `description`, `price`, `specifications`) in `CreateCrop.jsx` are rendered as advisory suggestions. Farmers have full manual editing control and must explicitly review and confirm before posting.
2. **Admin Sanity Signals**: The `aiReview` payload (`looksLikeProduce`, `issues[]`, `confidence`) is saved alongside the listing and rendered as an advisory badge on admin approval screens (`AdminApprovals.jsx` and `AdminCrops.jsx`).
3. **Statistical Price Guidance Band**: Market bands (`p25`, `median`, `p75`) are computed strictly from historical `PriceSnapshot` rows and displayed in `CreateCrop.jsx`, `MakeOfferModal.jsx`, and `NegotiationWidget.jsx`.
4. **Graceful Degradation**: If `GEMINI_API_KEY` is not set, network times out, or circuit breaker opens, the non-AI heuristic generator provides complete, valid listing drafts with zero unhandled exceptions.

## 4. How to Run
```bash
cd backend-ts
npm run eval:vision
```
