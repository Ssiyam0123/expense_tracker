# Project Memory: Daily Expense Tracker

## Current Product Direction

Build a production-grade daily expense tracker with:

- Web app: Next.js App Router.
- Backend: Next.js Route Handlers and Server Actions.
- Database: MongoDB with Mongoose.
- Local-first storage: IndexedDB.
- Auth: Auth.js/NextAuth with Google OAuth, plus secure server session.
- Design: dark-mode default, fast transaction entry, low-friction UX.

## Resolved Architecture Decisions

### 1. Database Conflict Fixed

Problem:

- Generic project instructions mention PostgreSQL.
- App brief uses MongoDB/Mongoose.
- User clarified this is a Next.js web app.

Decision:

- Use MongoDB for this app.
- Reason: brief already defines Mongoose schemas, ObjectId relations, and MongoDB aggregation for dashboards.
- Do not mix PostgreSQL unless project direction changes later.
- Do not build Expo/mobile version in MVP.

### 1.1 Framework Conflict Fixed

Problem:

- Original brief mixed Express API and Expo mobile app.
- Final product direction is web version with Next.js.

Decision:

- Use Next.js App Router as full-stack web app.
- Use Route Handlers for API-like sync/export endpoints.
- Use Server Actions for simple authenticated mutations when useful.
- Keep Mongoose/data access on server only.
- Default runtime: Node.js, not Edge, because Mongoose needs Node APIs.

### 2. Money Storage Fixed

Problem:

- `Number`/decimal money fields can create precision bugs.

Decision:

- Store money as integer minor units.
- Example: `150.75 BDT` becomes `amount_minor: 15075`.
- Store currency explicitly: `currency: "BDT"`.

Standard transaction fields:

```js
{
  user_id,
  amount_minor,
  currency,
  type,
  category_id,
  payment_method_id,
  timestamp,
  note,
  tags,
  local_id,
  source_device_id,
  sync_status,
  version,
  created_at,
  updated_at,
  deleted_at,
  synced_at
}
```

### 3. Offline Sync Fixed

Problem:

- Basic queue sync can duplicate transactions or lose edits/deletes.
- Web app cannot use Expo SQLite/AsyncStorage.

Decision:

- Browser stores offline transactions in IndexedDB.
- Each local transaction gets a stable `local_id` UUID.
- Each sync request sends an idempotency key.
- Backend upserts by `{ user_id, source_device_id, local_id }`.
- Queue retries with exponential backoff.
- Deletes use soft-delete tombstones via `deleted_at`.
- Conflict policy for MVP: Last-Write-Wins using `updated_at` and `version`.
- Optional PWA service worker can be added after core sync works.

### 4. Auth Security Fixed

Problem:

- Social login must not trust email from client.
- Web sessions need secure cookie handling.

Decision:

- Use Auth.js/NextAuth Google provider for MVP.
- Auth provider verifies OAuth identity.
- Server creates/loads user by verified provider id and email.
- Session stored in secure, HTTP-only cookies.
- Do not expose raw provider tokens to client components.
- Use server-side session checks for protected routes/actions.
- Apple login can be added later if needed.

### 5. User Isolation Fixed

Problem:

- Client-sent `user_id` can cause cross-user data leaks.

Decision:

- Backend never trusts `user_id` from request body.
- Auth middleware sets `req.user._id`.
- Every query filters by `user_id: req.user._id`.
- Integration tests must cover cross-user access denial.

### 6. API Contract Fixed

Problem:

- Brief has feature ideas but no exact endpoint contract.

Decision:

- API uses `/api/v1` for Route Handlers.
- All endpoints return consistent JSON:

```js
{
  data,
  error: null,
  meta
}
```

Error shape:

```js
{
  data: null,
  error: {
    code,
    message,
    details
  },
  meta
}
```

Minimum endpoints:

- `GET /api/auth/*`
- `POST /api/auth/*`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `GET /api/v1/payment-methods`
- `POST /api/v1/payment-methods`
- `GET /api/v1/transactions`
- `POST /api/v1/transactions/sync`
- `PATCH /api/v1/transactions/:id`
- `DELETE /api/v1/transactions/:id`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/budgets`
- `POST /api/v1/budgets`
- `GET /api/v1/export.csv`
- `GET /health`
- `GET /ready`

### 7. Validation Fixed

Problem:

- Missing request validation.

Decision:

- Use Zod for all request body/query validation.
- Reject unknown fields.
- Enforce body size limits.
- Sanitize notes/tags.
- Validate date ranges and pagination.

### 8. Production Ops Fixed

Problem:

- Brief lacks deployment/runtime safety.

Decision:

- Add Docker Compose for API + MongoDB.
- Add `.env.example`.
- Use structured logging with Pino.
- Use Sentry or equivalent error tracking.
- Add rate limiting for auth-sensitive and sync endpoints.
- Add CI for lint, test, and build.
- Add OpenAPI docs after endpoint contract stabilizes.
- Configure Next.js standalone output when Dockerizing.

### 9. Testing Strategy Fixed

Problem:

- Production risks need tests before feature growth.

Decision:

- Unit tests: services, validators, sync merge logic.
- Integration tests: server auth guard, CRUD ownership, sync idempotency, soft delete.
- Component tests: quick-log form, dashboard widgets.
- Browser tests later: offline queue state transitions and IndexedDB migrations.

Minimum backend test cases:

- Protected endpoints reject unauthenticated requests.
- Transaction create ignores body `user_id`.
- User A cannot read/update/delete User B transaction.
- Duplicate sync payload does not duplicate records.
- Offline delete sync marks `deleted_at`.
- Dashboard only aggregates current user data.

## MVP Build Order

1. Next.js foundation: App Router, Tailwind, env config, global layout, error pages.
2. Mongo foundation: connection helper, Mongoose models, indexes.
3. Auth: Auth.js/NextAuth Google login, session guard, protected app shell.
4. Core models: User, Category, PaymentMethod, Transaction, Budget.
5. Transactions API: list, sync, update, soft delete.
6. Dashboard summary: monthly spend, remaining budget, category split.
7. Quick-log UI: amount, category, payment method, type, note.
8. IndexedDB offline queue + sync engine.
9. Budgets + alerts.
10. Export CSV.

## Deferred Until After MVP

- Redis-backed recurring scheduler.
- S3 report pipeline.
- PDF export.
- Advanced analytics.
- Multi-currency conversion.
- Team/shared wallets.
- Native mobile app.

## Coding Guardrails

- Keep Route Handlers thin.
- Prefer Server Components for data reads.
- Use Client Components only for interactive UI and browser-only APIs.
- Keep IndexedDB code inside client-only modules.
- Put business logic in services.
- Put validation in schema files.
- Never manually edit `package-lock.json`.
- Never commit secrets or real `.env`.
- Prefer small files with clear ownership.
- Tests must cover security-sensitive behavior.
