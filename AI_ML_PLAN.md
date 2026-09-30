# AI_ML_PLAN.md — FarmDirect AI/ML roadmap (for coding agents)

> Drop this file in the repo root next to `AGENTS.md`. Read `AGENTS.md` first, then this file.
> Work ONE task at a time. Each task lists files, steps, and a done-check. Do not start a phase until the previous phase's gate passes.

---

## 0. Ground truth (verified by cloning the repo, HEAD `cc2cf58`)

**Layout**
- `backend-ts/` — Express 4 + Mongoose 8 + TypeScript, ESM (`"type": "module"`, imports end in `.js`), BullMQ + Redis (optional), Socket.io, zod, opossum, pino. **This is the only backend.**
- `F_1/` — React 19 + Vite 8 + Tailwind 4 + TanStack Query + i18next (en, hi) + Leaflet + Recharts.
- `docs/` — 12 architecture docs. Read `docs/DATABASE_SCHEMA.md`, `docs/API_SPECIFICATION.md`, `docs/RBAC_AND_PERMISSIONS.md` before touching models/routes.

**Health check results**
- `backend-ts`: `npm run typecheck` PASS, `npm run lint` PASS.
- `F_1`: `eslint .` PASS.
- `backend-ts` tests need `mongodb-memory-server` to download a Mongo binary. They could not run in the review sandbox (download blocked). Run them locally before starting: `cd backend-ts && npm test`. If they fail locally, fix that first (Phase 0, T0.1).

**Existing AI/ML-ish code (do not duplicate, extend)**
| Thing | Where | Reality |
|---|---|---|
| AgriBot chat | `backend-ts/src/services/aiService.ts`, `controllers/aiController.ts`, `routes/aiRoutes.ts`; FE: `F_1/src/components/ai/AgriBotWidget.jsx`, `services/aiChatService.js` | Gemini via `@google/genai`. Single-turn only (no history). No DB access, so no grounding on real listings/prices. Regex guardrails. Keyword fallback KB. |
| Anomaly detection | `services/anomalyService.ts`, `workers/anomalyWorker.ts`, `workers/queue.ts`, `models/UserOrderStats.ts`; admin list in `adminController.ts` (~line 640) | Welford running mean/variance on `totalAmount`, per-user then global, `|z|>3` flags `Order.flaggedAsAnomaly`. Amount-only, no reason codes, no feedback loop. |
| Recommendations | `cropController.ts`: `getTrendingCrops`, `getSimilarCrops`, `getRecommendedCrops` | Pure category match + sort by rating/sold/views. No behavior signal, no location, no season. |
| Voice search | `F_1/src/hooks/useVoiceSearch.js` | Web Speech API, `en-IN` only. |
| Analytics | `controllers/farmerController.ts` | Aggregations only. `calculatePerformanceScore` is a hand-tuned formula. |

**Data reality (this decides what ML is possible)**
- `CropListing.price` is overwritten in place → **no price history exists**. Forecasting is impossible until Phase 0 captures it.
- `CropListing.dailySales[]` is an embedded, unbounded array (written in `adminController.ts` ~line 386). Do NOT use it as an ML source or let it grow further; create a separate collection.
- `views` is a counter, not events. No search/click/add-to-cart events are stored. Recommenders need events.
- No seed data: root `package.json` and `backend-ts/package.json` reference `src/scripts/seedData.ts`, which does not exist. `AGENTS.md` and root scripts also reference a `backend/` directory that does not exist.
- `User.kycDetails.aadharNumber` / `governmentIdNumber` are stored as plain strings. **Never send any `kyc*` field to an LLM or ML service.** Treat plaintext Aadhaar storage as a separate hardening task (mask/encrypt).

**Architecture facts agents must respect**
- `server.ts` forks `os.cpus().length` cluster workers, and EVERY worker calls `startAnomalyWorker()`, `startOutboxWorker()`, `startOutboxPollingWorker()`, `startPaymentReconciliationWorker()`. Any new scheduled/batch job MUST be single-instance guarded (Redis lock via `SET NX EX`, or only run when `cluster.worker.id === 1`). Otherwise it runs N times.
- Redis is optional (`connection` may be `undefined`). New queue code must degrade gracefully like `enqueueAnomalyDetection` does.
- `circuitBreaker.ts` (opossum wrapper) already exists. Use it for every call to an external model/service.
- Responses use `sendError` / `sendSuccess` from `utils/apiResponse.ts`; handlers use `asyncHandler`; input validation uses zod in `schemas/`; caching uses `cacheRoute` / `utils/cache.ts`; rate limiting uses `createRateLimitStore`.
- Frontend `i18n.js` loads ONLY `locales/en/translation.json` and `locales/hi/translation.json`, and `scripts/check-i18n.js` (part of `npm run lint`) compares those two. `locales/en.json` and `locales/od.json` are orphaned. Odia is not actually wired up.

---

## 1. Known defects to fix on the way (small, do in Phase 0)

1. `aiService.ts` `INJECTION_PATTERNS`: the last regex has the `g` flag. `RegExp.test()` on a global regex is stateful (`lastIndex`), so it alternates between match/no-match on repeated input. Remove `g`.
2. `aiService.ts` `classifyTopic`: substring checks like `combined.includes('decline')` and `'rate'` misclassify (e.g. "moderate", "generate"). Replace with structured output (Phase 1).
3. `aiService.ts` `candidateModels = ['gemini-3.6-flash', 'gemini-flash-latest']`: verify the first model ID exists for your API key. Move model IDs to env (`GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`).
4. System prompt promises "mandi benchmarks" and pricing help but the bot has no price data → it will hallucinate prices. Fixed by tool-grounding in Phase 1; until then, remove the pricing claim.
5. `outboxWorker.ts` populates `cropId` with `'name images price'` but the schema field is `cropName`. Verify and fix.
6. 37 raw `console.log` calls while `utils/logger.ts` (pino) exists. New code uses the logger only.
7. Repo hygiene (matters because recruiters read repos): remove `F_1/stats.json` (58k lines), `F_1/lh-report.json`, `F_1/screenshot.png` if not used in README, `scratch/`, `backend-ts/fixDb.ts`, root `optimize.js`; delete stale `backend/` references in `AGENTS.md` and root `package.json`.

---

## 2. Target architecture

```
React (F_1)  ──►  Express API (backend-ts)  ──►  MongoDB
                     │   ▲
                     │   └── BullMQ jobs (Redis, optional)
                     ├──► Gemini (LLM, vision, embeddings)   [via circuit breaker]
                     └──► ml-service (Python FastAPI)         [via circuit breaker, internal only]
                              ├─ price forecast
                              ├─ recommender / embeddings index
                              └─ anomaly model
```

Rules:
- **Node stays the only public API and the only thing that touches the DB with user auth.** `ml-service` is internal, receives feature vectors or IDs, never raw PII, never `kyc*`.
- **Every AI feature has a non-AI fallback** (the existing code path). If Gemini/ml-service is down, the app still works. Flag with env: `AI_CHAT_ENABLED`, `AI_VISION_ENABLED`, `ML_SERVICE_URL` (unset = feature falls back).
- **LLM never does arithmetic or authorization.** Numbers are computed in code; the LLM only narrates. User identity for tool calls comes from `req.user`, never from model-generated arguments.
- **Every ML feature ships with an offline eval and a baseline** it must beat. If it doesn't beat the baseline, don't show it in the UI.

New folders:
```
backend-ts/src/ai/            # llm client, prompts, tools, guardrails, embeddings
backend-ts/src/ai/tools/      # one file per agent tool
backend-ts/src/models/        # PriceSnapshot, EventLog, AiConversation, AiUsage, Embedding(optional)
ml-service/                   # Python FastAPI (Phase 3+)
ml-service/notebooks/         # EDA + backtests (commit outputs as PNG/MD)
eval/                         # golden sets + eval scripts (chat, guardrails, recsys, forecast)
```

---

## 3. Phases

### PHASE 0 — Foundations (gate: everything below green before Phase 1)

**T0.1 Make tests runnable.** Ensure `mongodb-memory-server` works locally/CI (pin binary version via `MONGOMS_VERSION` in `jest` setup or CI cache). Done when `npm test` passes locally and in CI.

**T0.2 Fix defects in §1** (items 1–3, 5, 7). Done when typecheck + lint + tests pass.

**T0.3 Seed script.** Create `backend-ts/src/scripts/seedData.ts` (the `seed` npm script already points here). Generate synthetic but realistic data: ~200 farmers, ~1000 buyers, ~40 crop types (Odisha-relevant: rice, potato, tomato, brinjal, okra, mango, banana, coconut, turmeric, etc.), 12–18 months of orders/reviews/negotiations with **seasonal price curves + noise + a few injected anomalies**. Mark seeded docs with `isSynthetic: true` (add optional field) so real and fake data can be separated. Deterministic via seeded RNG. Done when `npm run seed` gives a marketplace that looks alive and is reproducible.

**T0.4 Price history capture.** New model `PriceSnapshot { cropId, cropName, category, region(city/state from farmer), price, unit, at }`. Write a snapshot (a) on crop create, (b) on price update in `updateCrop`, (c) on order completion (transaction price). Add index `{cropName:1, region:1, at:-1}`. Done when price changes produce snapshot rows (add a test).

**T0.5 Event log.** New model `EventLog { userId?, sessionId, type: 'view'|'search'|'click'|'wishlist'|'cart'|'interest'|'offer'|'order', cropId?, query?, meta, at }` with TTL index (e.g. 400 days). Endpoint `POST /api/events` (batched, rate-limited, zod-validated, optional auth). Frontend: a tiny `services/eventService.js` that batches and flushes every 5s / on page hide. Done when browsing generates events; no PII beyond ids.

**T0.6 AI plumbing.** `backend-ts/src/ai/llmClient.ts` wrapping `@google/genai` with: circuit breaker, timeout, retry-once, model IDs from env, and usage logging to `AiUsage { userId, feature, model, inputTokens, outputTokens, latencyMs, at }`. Per-user daily token cap from env. Done when aiService uses it and usage rows appear.

**GATE 0:** typecheck, lint, tests green; seed works; PriceSnapshot + EventLog populated by normal use.

---

### PHASE 1 — Grounded AgriBot (agentic, tool-using)

Goal: turn the FAQ-bot into an assistant that answers from live marketplace data and takes safe actions.

**T1.1 Conversation memory.** Model `AiConversation { userId, messages[{role, content, toolCalls?, at}], updatedAt }`, cap to last ~10 turns sent to the model, TTL 30 days. Endpoints: `POST /api/ai/chat` (keep contract, add `conversationId`), `GET /api/ai/conversations`, `DELETE /api/ai/conversations/:id`. Frontend `AgriBotWidget.jsx` keeps `conversationId`.

**T1.2 Tool layer** (`backend-ts/src/ai/tools/*`). Use Gemini function calling. Each tool: zod arg schema, `run(args, ctx)` where `ctx.user` comes from `req.user`.
- `search_crops({query, category?, maxPrice?, organic?, location?})` → wraps the same query logic as `getCrops` (approved+active only).
- `get_crop({cropId})`, `get_price_stats({cropName, region?, days})` → from `PriceSnapshot` (min/median/max, trend %).
- `my_orders({status?})` (buyer/farmer scoped to `ctx.user`), `order_status({orderNumber})` (ownership check).
- `my_negotiations()`, `my_listings()` (farmer), `low_stock()` (farmer).
- `navigate({route})` → returns whitelisted routes only (replaces `deriveActionLinks` substring logic).
- **No write tools in this phase** except `navigate`. Writes (create offer, add to cart) come later, behind an explicit user-confirm step in the UI.
- Role gating: tool list passed to the model depends on `ctx.user.role`. Guests get only `search_crops`, `get_crop`, `get_price_stats`.

**T1.3 Structured output.** Ask the model for JSON `{reply, topic, suggestions[], actions[]}` (Gemini `responseSchema`). Delete `classifyTopic`, `deriveActionLinks`, `deriveSuggestions`. Validate with zod; on parse failure retry once, then fall back to plain text.

**T1.4 Guardrails.** Keep regex as a cheap pre-filter only. Add: (a) input length + control-char sanitization, (b) system-prompt says user content is untrusted data, (c) tool results are wrapped/quoted as data, (d) output filter strips anything that looks like system prompt leakage, (e) never include another user's data (test it).

**T1.5 Streaming.** SSE endpoint `POST /api/ai/chat/stream`; frontend renders tokens progressively. Keep the non-stream endpoint as fallback.

**T1.6 Multilingual.** Detect user language; reply in English/Hindi/Odia. Wire Odia into the UI properly: add `locales/od/translation.json`, register `od` in `i18n.js` `resources` + `supportedLngs`, extend `check-i18n.js` to cover it. Voice: make `useVoiceSearch` take a language (`en-IN`, `hi-IN`, `or-IN` — Odia support in the Web Speech API is browser-dependent; feature-detect and fall back).

**T1.7 Knowledge base (RAG) for farming advice.** Only use content you have rights to (write original short guides, or public-domain / government open data with attribution). Chunk → embed (Gemini embeddings) → store (Mongo `Embedding` collection with cosine in code for <10k chunks, or Atlas Vector Search if on Atlas). Tool `farming_kb({question})` returns top-k chunks with source ids; answer must cite them. Advice about pesticides/dosage must include "confirm with your local KVK / agriculture officer".

**T1.8 Eval.** `eval/chat/golden.jsonl` (≥60 cases): grounding (price answers match DB), authorization (asks about someone else's order → refused), injection (≥15 attacks), off-topic, Hindi/Odia, tool-failure fallback. `npm run eval:chat` prints pass rate; CI runs it with a mocked model for the deterministic parts.

**GATE 1:** golden set ≥90% pass; a user can never retrieve another user's data (dedicated test); bot works with `GEMINI_API_KEY` unset (falls back to KB).

---

### PHASE 2 — Smart listing (multimodal + price guidance)

**T2.1 Photo → listing draft.** On `CreateCrop.jsx` (`F_1/src/pages/CreateCrop.jsx`) after image upload, call `POST /api/ai/listing-draft` with the uploaded image URL(s). Gemini vision returns structured JSON: `{cropName, category, cropType, ripeness, colour, size, qualityGrade: A|B|C, confidence, description}`. UI pre-fills fields as **suggestions the farmer must confirm** (never auto-submit). Reuse enums from `types/enums.ts` so output maps to valid values (constrain via `responseSchema` enum).

**T2.2 Image sanity signal for admin.** Same call returns `looksLikeProduce: boolean` and `issues[]` (blurry, stock photo watermark, not produce). Store on the listing as `aiReview { looksLikeProduce, issues, confidence }` and show in the admin approval screen (`F_1/src/pages/dashboards/AdminApprovals.jsx`). Advisory only — admin still decides.

**T2.3 Price guidance v1 (statistical, no ML).** `GET /api/ai/price-guidance?cropName&region` → p25/median/p75 over last 30/90 days from `PriceSnapshot`, adjusted for organic flag. Show a "market band" bar on CreateCrop and on `MakeOfferModal.jsx` / `NegotiationWidget.jsx`. Needs ≥N snapshots else return `insufficient_data` (UI hides the widget).

**GATE 2:** on a labelled set of ~100 crop photos, cropName top-1 accuracy is measured and reported in `eval/vision/README.md`; farmers can always override.

---

### PHASE 3 — Recommendations & semantic search

**T3.1 Embeddings for listings.** On approve/update, embed `cropName + category + description + specs` → store. Background backfill script.

**T3.2 Semantic + multilingual search.** `GET /api/crops/search?q=` → hybrid: Mongo text index score + embedding similarity (reciprocal rank fusion). Handles "aloo", "aam", "ଆଳୁ". Falls back to existing `getCrops` search when embeddings are unavailable. Wire into `SearchBar.jsx` / `AdvancedSearch.jsx`.

**T3.3 Recommender.** Keep the route `GET /crops/buyer/recommended`; replace internals with a hybrid: (a) content-based (embedding similarity to user's recent orders/wishlist/views), (b) item-item co-occurrence from orders + wishlist + interest events, (c) boosts for same region and in-season, (d) popularity prior for cold start. Keep the old implementation as `fallback`. Implement in Node first (co-occurrence matrix via aggregation, nightly, single-instance guarded); move to `ml-service` only if it needs it.

**T3.4 Offline eval.** `eval/recsys/`: leave-last-out on orders, report Recall@10 / NDCG@10 vs baselines (popularity, current category-match). **Ship only if it beats current.** With seeded data this is a demo; label results as synthetic.

**T3.5 Similar items** (`getSimilarCrops`): rank by embedding similarity within approved/active, tiebreak on rating.

**GATE 3:** eval table committed in `eval/recsys/RESULTS.md` showing new > baseline; search works with AI off.

---

### PHASE 4 — Forecasting & farmer insights (`ml-service` starts here)

**T4.1 `ml-service` scaffold.** FastAPI, Dockerfile, `/health`, `/forecast/price`, pydantic models, API-key header shared with Node (`ML_SERVICE_KEY`), no public exposure. Node client in `backend-ts/src/ai/mlClient.ts` behind circuit breaker with `ML_SERVICE_URL` optional.

**T4.2 Price forecast.** Per (crop category or cropName, region) daily/weekly median price series from `PriceSnapshot`. Models: seasonal-naive (baseline) → `statsforecast` ETS/ARIMA → LightGBM with lags + month + festival flags. Rolling-origin backtest, report MAPE/sMAPE per crop. **Serve forecast only for series where the model beats seasonal-naive**; response includes `p10/p50/p90` and `confidence`. Retrain nightly (single-instance guarded), cache in Redis.

**T4.3 Farmer "when to sell / what to plant" card.** In `FarmerAnalytics.jsx` / `FarmerDashboardNew.jsx`: forecast chart (Recharts, already a dependency) + a one-line recommendation computed in code (e.g. "median expected +8% in 2 weeks; hold 5 days"). LLM only rewrites the sentence into the user's language.

**T4.4 Smart low-stock.** Replace static `lowStockThreshold` alerts with days-of-cover = stock / recent daily sales (from a new `SalesDaily` collection, not the embedded `dailySales`). Notify via existing `Notification` + socket path.

**T4.5 Weekly digest.** BullMQ repeatable job (single-instance guarded) computes farmer KPIs in code, LLM narrates in preferred language, saved as a `Notification`. Respect `notificationPreferences`.

**GATE 4:** backtest report in `eval/forecast/RESULTS.md`; UI hides forecasts that don't beat baseline; app works with `ML_SERVICE_URL` unset.

---

### PHASE 5 — Trust, risk, and assistants

**T5.1 Anomaly v2.** Keep Welford path as fallback. New features per order: unit price / market median (from PriceSnapshot), qty z-score per crop, buyer account age, orders in last hour, COD vs prepaid, buyer cancel rate, negotiation discount %, address/pincode mismatch. Model: robust z (median/MAD) rules first, then IsolationForest in `ml-service`. Output `{score, reasons[]}` stored on `Order` (`anomalyReasons`). Admin UI shows reasons and has **Confirm / Dismiss** buttons → writes `anomalyLabel` (this becomes your labelled dataset). Add a test with injected anomalies from the seed data and report precision/recall.

**T5.2 Reviews.** Sentiment + spam/toxicity classification on new `Review` (sets existing `isFlagged`); per-crop "review summary" (LLM, cached, regenerated when count changes by ≥5). Show on `CropDetail.jsx` / `ProductReviews.jsx`.

**T5.3 Negotiation copilot.** In `NegotiationWidget.jsx` / `MakeOfferModal.jsx`: suggest an offer range for buyers and a counter for farmers using price band + historical acceptance rates by discount %. Later: acceptance probability model (logistic regression on Negotiation history). Advisory only.

**T5.4 KYC assist (optional, do last, admin-only).** OCR + field-consistency check to speed up admin review in `AdminVerification.jsx`. Hard rules: never auto-approve/reject; never log or embed document numbers; use a self-hosted/OCR path or get explicit consent before sending to any third party; mask numbers in UI. If you cannot meet these, skip this task.

**T5.5 Chat assist (optional).** Translate farmer↔buyer messages (Hindi/Odia/English) on demand; smart-reply chips. Opt-in per conversation.

**GATE 5:** anomaly precision/recall documented; every advisory feature has a manual override; privacy checklist (below) passes.

---

## 4. Rules for the coding agent

**Every task**
1. Run from `backend-ts/`: `npm run typecheck && npm run lint && npm test`. From `F_1/`: `npm run lint && npm run build`. Do not finish a task with any of these red.
2. New backend files: ESM with `.js` import suffixes, `asyncHandler`, `sendError/sendSuccess`, zod schema in `src/schemas/`, register routes in `src/app.ts`, add env keys to `src/config/env.ts` AND `.env.example`.
3. New protected routes: use `protect` + `authorize(...)` from `middleware/auth.ts`; AI routes get their own rate limiter (pattern in `routes/aiRoutes.ts`) and per-user token caps.
4. Add at least one test per task (`src/tests/`), using existing `testApp.ts` / `setup.ts`.
5. Frontend: every user-facing string goes in BOTH `locales/en/translation.json` and `locales/hi/translation.json` (and `od` after T1.6) or `npm run lint` fails on `check-i18n`. Reuse components in `components/common/`. Show loading skeletons (`SkeletonLoader`) and an error state; AI UI must show a "suggested by AI" label and be dismissible.
6. Use `utils/logger.ts`, not `console.log`.
7. Update `docs/API_SPECIFICATION.md` and `docs/DATABASE_SCHEMA.md` when adding endpoints/models.
8. Small commits, conventional messages (`feat(ai): ...`), one task per PR.

**Never**
- Send `kyc*` fields, passwords, tokens, phone numbers, or full addresses to an LLM or `ml-service`.
- Let model output decide authorization, prices charged, or order state.
- Put secrets in the repo. `GEMINI_API_KEY` etc. stay in `.env`.
- Add a scheduler/worker without a single-instance guard (see §0 cluster note).
- Ship an ML feature without a baseline comparison.
- Use `localStorage`-style state for anything server-relevant.

**Privacy checklist (Gate 5)**
- [ ] No PII in prompts, logs, or `AiUsage`.
- [ ] `AiConversation` has TTL + user delete endpoint.
- [ ] `EventLog` has TTL and stores ids only.
- [ ] Tool calls are scoped by `req.user`; cross-user access test exists.
- [ ] All AI outputs are labelled and overridable.

---

## 5. Suggested order if time is short (portfolio impact per effort)

1. Phase 0 (T0.1–T0.6) — unglamorous but everything depends on it.
2. T1.1–T1.3 + T1.8 — grounded tool-using AgriBot with an eval. Strongest demo.
3. T2.1 + T2.3 — photo-to-listing + price band. Very visual.
4. T3.2 + T3.4 — multilingual semantic search + measured recommender.
5. T4.2 — forecast with honest backtest.
6. T5.1 — anomaly v2 with reasons and admin labels.

Document each result (metrics, screenshots, tradeoffs) in the README under an "AI/ML" section — measured numbers vs. baselines are what make this credible.
