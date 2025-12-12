# SwarnaVyapar Subscription & Usage Metering System Design

## 0. core Design Decision: Subscription Scope

**Decision: Per-Shop Subscription (Workspace Model)**
The system is designed so that **SUBSCRIPTIONS ARE ATTACHED TO THE SHOP**, not the Admin user.

### Why this model?
1.  **Multi-Shop Flexibility**: An Admin might own 3 shops. Shop A (Main Branch) needs the "Platinum" plan with AI, while Shop B (Pop-up) only needs "Free".
2.  **Scalability**: Usage limits (Inventory counts, AI tokens) are distinct per shop. Grouping them under a user would make metering complex (e.g., which shop consumed the AI tokens?).
3.  **Team Access**: If an Admin invites a Manager to Shop A, the plan follows the Shop. The Manager doesn't need to pay.

**Implication**:
*   The `shop_subscriptions` table links specific `shop_id` -> `plan_id`.
*   An Admin user effectively manages billing for *each* shop they own.

---

## 1. Usage Tracking System

### What to Track
To determine plan eligibility and fair usage, we must track "Usage Events".
*   **Core Resources**:
    *   `invoices_created` (Count)
    *   `customers_added` (Count)
    *   `products_added` (Count) - Inventory Size
    *   `staff_seats_occupied` (Count) - Current Active Staff
    *   `storage_used_mb` (Volume) - Document uploads
*   **AI Consumption**:
    *   `ai_tokens_input` (Prompt Tokens)
    *   `ai_tokens_output` (Completion Tokens)
    *   `ai_requests_total` (Count)

### Event Tracking Schema
We will use a **PostgreSQL (Supabase) Event Log** approach. Avoid separate tables for every counter. Use a centralized `usage_events` table for high-volume logs and a `shop_usage_aggregates` table for fast reads.

**Strategy**:
1.  **Usage Events Table**: Immutable log of every action (high write throughput).
2.  **Aggregates Table**: Monthly snapshots (updated via Triggers or Edge Functions).

### Implementation Choice
*   **Supabase RLS**: Not for tracking. Tracking should happen securely on the server side (API Routes/RPC) to prevent client-side tampering.
*   **Database Triggers**: Use Postgres triggers to auto-increment the `shop_usage_aggregates` whenever a row is inserted into `invoices` or `customers`. This is atomic and fail-safe.

---

## 2. AI Token Usage Metering

### Token Limit Assignment
Limits are defined in the `plans` table.
*   `FREE`: 10,000 Tokens/mo
*   `GOLD`: 100,000 Tokens/mo
*   `PLATINUM`: Unlimited (or Fair use cap 2M)

### Storage & Consumption
1.  **Request**: User asks AI.
2.  **Pre-Check**: Backend checks `shop_usage_aggregates.ai_tokens_used < plans.ai_token_limit`.
3.  **Execution**: Call OpenAI.
4.  **Logging**: detailed calculation using `tiktoken` (or char count / 4).
5.  **Increment**: Update `shop_usage_aggregates` (Atomic Increment).

### Preventing Abuse
*   **Backend Proxy**: NEVER call OpenAI from the client. Always proxy via `/api/ai/*`.
*   **Rate Limiting**: Limit requests/minute/shop using Upstash (Redis) or Supabase generic rate limiting.

---

## 3. Feature-Based Access Control

### Locking Features
Use a `features` JSONB column in the `plans` table to define capabilities.
```json
// Plan Features Structure
{
  "can_remove_branding": true,
  "max_staff": 5,
  "ai_insights": true,
  " whatsapp_integration": false
}
```

### Implementation
1.  **Middleware/High-Order Component**: `withFeatureGate('ai_insights', Component)`.
2.  **DB Permission**: Create a PostgreSQL Policy function `can_access_feature(shop_id, 'feature_key')`.

### UI Best Practices
*   **Locked State**: Use a `Lock` icon overlay with a blur effect.
*   **Upgrade CTA**: "Available on Gold Plan. Upgrade Now."

---

## 4. Real-Time Usage Dashboard

### Usage Analytics to Show
*   **Progress Bars**:
    *   AI Tokens: `(Used / Limit) * 100` (Color: Green -> Yellow -> Red)
    *   Staff Seats: `(Created / Max) * 100`
    *   Storage: `(Used MB / Limit MB) * 100`
*   **Alerts**:
    *   "80% of AI Limit Used" (Warning Banner).
    *   "Limit Reached" (Blocking Alert).

---

## 5. Backend Architecture (Supabase)

### Schema Design

```sql
-- 1. Plans Table
CREATE TABLE plans (
    id TEXT PRIMARY KEY, -- 'free', 'gold', 'platinum'
    name TEXT NOT NULL,
    limits JSONB NOT NULL, -- { "ai_tokens": 10000, "staff": 2, "invoices": 100 }
    features JSONB NOT NULL -- { "analytics": true }
);

-- 2. Shop Subscription Status
CREATE TABLE shop_subscriptions (
    shop_id UUID REFERENCES shops(id) PRIMARY KEY,
    plan_id TEXT REFERENCES plans(id),
    status TEXT, -- 'active', 'past_due', 'canceled'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ
);

-- 3. Aggregated Usage (Reset Monthly)
CREATE TABLE shop_usage_limits (
    shop_id UUID REFERENCES shops(id),
    period_start TIMESTAMPTZ, -- '2025-12-01'
    ai_tokens_used BIGINT DEFAULT 0,
    invoices_created INT DEFAULT 0,
    storage_bytes BIGINT DEFAULT 0,
    PRIMARY KEY (shop_id, period_start)
);
```

### Architecture Flow
1.  **Action**: User creates Invoice.
2.  **API Handler**: `POST /api/invoices`.
3.  **DB Trigger**: `AFTER INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION increment_invoice_count()`.
4.  **Middleware**: AI Request checks `shop_usage_limits`.

---

## 6. Billing Enforcement

### Expiration Logic
*   **Cron Job**: Run a nightly Supabase Query to check `current_period_end < NOW()`.
*   **Action**: Update `status` to `past_due`.
*   **Middleware**: If `status === 'past_due'`, redirect all routes to `/billing`.

### Graceful Downgrade
If a user creates 5 staff (Gold) and downgrades to Free (Max 2):
*   Do NOT delete data.
*   "Freeze" the most recently added 3 accounts (mark `is_active = false`).

---

## 7. Security & Anti-Abuse

1.  **Validation**: Reject API calls with `quantity < 0` (negative usage).
2.  **Idempotency**: Use `idempotency_key` mechanism for usage increments to prevent double-counting on network retries.
3.  **Spending cap**: Hard stop for AI tokens even for paid plans to prevent runaway bills (e.g., $50/mo cap).

---

## 8. Practical Implementation Steps

### Usage Event Model (Example)

```typescript
// Core function to track AI usage
export async function trackAiUsage(shopId: string, model: string, inputTokens: number, outputTokens: number) {
  const total = inputTokens + outputTokens;
  
  // 1. Log detailed event (for audit)
  await supabase.from('usage_events').insert({
    shop_id: shopId,
    event_type: 'ai_completion',
    metadata: { model, inputTokens, outputTokens },
    cost_value: total
  });

  // 2. Increment aggregate (RPC call for atomicity)
  await supabase.rpc('increment_usage', {
    p_shop_id: shopId,
    p_metric: 'ai_tokens_used',
    p_amount: total
  });
}
```

### OpenAI Token Counter (Example)

```typescript
import { Tiktoken } from "js-tiktoken"; // Lightweight tokenizer

export function estimateTokens(text: string): number {
  // Simple approximation for speed, or use tiktoken for accuracy
  // ~4 chars per token
  return Math.ceil(text.length / 4);
}
```

### API Endpoint (Usage) (`/api/v1/shops/[shopId]/usage`)

```typescript
export async function GET(req) {
  // Return combined object of { plan, limits, current_usage }
  // Frontend calculates percentages
}
```
