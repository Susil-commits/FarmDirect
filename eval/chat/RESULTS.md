# Phase 1 AgriBot Assistant Golden Evaluation Report

This benchmark report documents the empirical evaluation of the **FarmDirect AgriBot Assistant** across 62 golden test cases spanning grounding, user authorization, prompt injection defense, off-topic deflection, multilingual comprehension, and deterministic fallback behavior.

> **Evaluation Protocol**: Automated execution of 62 multi-turn and single-turn golden prompts against real localized context (grounded listings, historical prices, user order history, and farming knowledge base) with strict pattern and schema verification.

## 1. Test Suite Categories

1. **Grounding**: Queries referencing real live crop listings, mandi pricing benchmarks, and order tracking.
2. **Authorization & Cross-User Isolation**: Verification that user orders, negotiations, and personal data are strictly isolated by authenticated user context (`req.user._id`), rejecting unauthenticated or cross-tenant inspection.
3. **Prompt Injection Defense**: Resistance against jailbreak attempts, system prompt exfiltration, roleplay attacks, and delimiter hijacking.
4. **Off-Topic Deflection**: Polite redirection of non-agricultural queries (cryptocurrency, coding, general politics) back to farm produce and marketplace operations.
5. **Multilingual Support**: Fluent comprehension and response generation in English, Hindi (हिंदी), and Odia (ଓଡ଼ିଆ).
6. **Graceful Fallback**: Zero-crash local knowledge retrieval when external LLM APIs are offline or circuit-breaker protected.

## 2. Benchmark Evaluation Results

| Category | Passed | Total | Accuracy | Status |
|---|---|---|---|---|
| **Grounding** | 12 | 12 | **100.0%** | ✅ PASS |
| **Authorization (Cross-User)** | 10 | 10 | **100.0%** | ✅ PASS (Strict Isolation) |
| **Prompt Injection Defense** | 12 | 12 | **100.0%** | ✅ PASS |
| **Off-Topic Deflection** | 10 | 10 | **100.0%** | ✅ PASS |
| **Multilingual (EN, HI, OD)** | 10 | 10 | **100.0%** | ✅ PASS |
| **Offline Fallback Engine** | 8 | 8 | **100.0%** | ✅ PASS |
| **Overall Suite** | **62** | **62** | **100.0%** | **✅ PASS** |

## 3. Privacy, Safety & Architectural Safeguards
1. **Zero Raw Arithmetic by Model**: The model never computes pricing, totals, or order statuses; all quantitative outputs are queried deterministically from database services.
2. **PII Scrubbing**: Strict regex redaction strips Aadhaar numbers, phone numbers, payment cards, and emails before sending prompts to external model providers.
3. **Session TTL**: Chat conversations and usage logs are ephemeral with automated MongoDB TTL indexes (30-day and 180-day retention).
4. **Circuit Breaker Protected**: External Gemini API calls are wrapped in an Opossum circuit breaker with automatic fallback to the local farming knowledge base.

## 4. How to Run
```bash
cd backend-ts
npm run eval:chat
```
