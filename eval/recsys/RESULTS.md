# Phase 3 Recommendations & Semantic Search Evaluation

This benchmark report compares the **Proposed Hybrid Recommender** against baseline algorithms using a leave-last-out protocol across buyer interaction journeys.

> **Disclaimer**: This benchmark was evaluated against a small synthetic dataset ($n=8$ test journeys) representing vegetable cooking baskets, grain/dal staples, and seasonal fruits in Indian rural commerce.

## 1. Evaluation Methodology
- **Protocol**: Leave-Last-Out on buyer order sequences. For each buyer journey with $\ge 3$ interactions, the first $N-1$ purchases are used as context, and the $N$-th purchase is the target.
- **Top-K Cutoff**: $K = 10$.
- **Metrics**:
  - **Recall@10 (Hit Rate)**: Percentage of test cases where the held-out target item appears in the Top-10 recommended list.
  - **NDCG@10 (Normalized Discounted Cumulative Gain)**: Position-sensitive ranking metric with discount $\frac{1}{\log_2(\text{rank} + 1)}$.

## 2. Benchmark Results
| Model | Recall@10 | NDCG@10 | Relative Lift vs Category Baseline | Finding |
|---|---|---|---|---|
| **Global Popularity Baseline** | 62.5% (5/8) | 0.224 | - | Baseline |
| **Category-Match Baseline (Legacy)** | 37.5% (3/8) | 0.165 | 0.0% | Baseline |
| **Proposed Hybrid Recommender** | **50.0% (4/8)** | **0.454** | **+12.5% Recall** | **Beat legacy baseline, but not popularity on n=8 synthetic cases** |

## 3. Evaluation Analysis & Honest Takeaways
- **Sample Size ($n=8$)**: The dataset contains 8 evaluation journeys (yielding 3/8, 4/8, and 5/8 hit rates). These sample sizes are indicative demos on synthetic seed data, not statistically significant proofs of algorithmic superiority.
- **Recall vs. Popularity**: The hybrid model (50.0% Recall@10) beat the weak legacy category-matching baseline (37.5%), but fell short of global popularity (62.5%). Popularity is notoriously difficult to beat on synthetic or small-catalog datasets.
- **Ranking Quality (NDCG)**: The hybrid engine achieved a higher NDCG@10 (0.454 vs 0.224 for popularity and 0.165 for category), indicating that when hits occurred, they were ranked higher due to profile embeddings and basket co-occurrence.
- **Interview/Portfolio Framing**: Report as: *"The hybrid recommender beat the legacy category baseline (+12.5% Recall, +175% NDCG) but did not beat global popularity on n=8 synthetic test cases. Requires A/B testing on live production traffic for conclusive validation."*

## 4. Architecture Details
1. **Content-Based Profile Vector**: Computes weighted average vector from user's orders ($3.0\times$), wishlists ($2.0\times$), and views ($1.0\times$) using listing embeddings.
2. **Item-Item Co-occurrence Matrix**: Aggregated from purchase baskets and wishlists to capture complementary products (e.g. Tomato + Onion + Potato).
3. **Contextual Boosts**:
   - **Regional Proximity**: $+15\%$ boost for listings within the buyer's state/district.
   - **Seasonal Match**: $+10\%$ boost for currently harvesting seasonal crops (Kharif, Rabi, Zaid).
   - **Organic Affinity**: $+10\%$ boost if buyer shows historic preference for organic certified crops.
4. **Graceful Fallback & Cold Start**: If user has no interaction history, popularity prior and regional discovery automatically guide recommendations. If embeddings or vectors are unavailable, legacy category matching acts as a zero-failure fallback.

## 5. Gate 3 Validation Status
- [x] **Beats Legacy Category Baseline**: Hybrid Recall@10 (50.0%) > Category Baseline (37.5%).
- [x] **NDCG Ranking Lift**: Hybrid NDCG@10 (0.454) > Category Baseline (0.165).
- [ ] **Beats Global Popularity**: Popularity Recall@10 (62.5%) remains ahead on synthetic test split ($n=8$).
- [x] **AI-Off Fallback Operability**: System functions seamlessly with zero external LLM API calls using deterministic vectors and category fallbacks.

## 6. How to Run
```bash
cd backend-ts
npm run eval:recsys
```
