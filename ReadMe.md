<div align="center">
  <img src="./budgetify.png" alt="Budgetify Icon" style="width: 150px; height: 150px; border-radius: 15%"/>

# Budget App Backend — Event-Driven & Serverless

> Backend system powering an **offline-first collaborative budgeting app**. Accepts immutable client events, resolves conflicts via server-authoritative versioning, and delivers ordered change streams to keep multiple devices eventually consistent.

[![Node.js](https://img.shields.io/badge/Runtime-Node.js-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org)
[![AWS](https://img.shields.io/badge/Cloud-AWS-orange)](https://aws.amazon.com)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-purple)](https://www.terraform.io)

**[Android App](https://github.com/rahulstech/budget-app-android) · [LinkedIn](https://www.linkedin.com/in/rahul-bagchi-176a63212/) · [GitHub](https://github.com/rahulstech) · [Email](mailto:rahulstech18@gmail.com)**

</div>

---

## Why This Project Exists

Standard CRUD APIs assume the client and server are always in sync. This backend was built to solve a harder problem: **what happens when multiple users edit shared data independently, sometimes offline, and changes arrive out of order?**

Instead of mutating state directly, this system accepts **immutable, idempotent events** from clients. Every change is validated against server-side version numbers, conflicts are resolved deterministically, and clients receive an ordered stream of accepted events to reconstruct consistent local state.

This is the backend counterpart to a [collaborative Android budgeting app](https://github.com/rahulstech/budget-app-android) that implements the Outbox/Inbox sync pattern. Both sides were designed together — the API contract, event model, and conflict resolution strategy are deliberately co-designed across client and server.

---

## System Overview

```
Client
  │
  ├── POST /events          → API Gateway → Lambda → PostgreSQL
  │                                 ↓
  │                         Firebase Auth (per-request token validation)
  │
  ├── GET  /events          → long-poll for ordered change stream (inbox)
  │
  └── GET  /user/photo-upload-url → S3 presigned URL → client uploads direct
                                         ↓
                                    CloudFront CDN (serves profile photos)
```

**Infrastructure managed entirely via Terraform.** No manual console configuration.

---

## Architecture

### Single Lambda, Monolithic Handler

All routes are handled by one Lambda function rather than separate per-route Lambdas. This was a deliberate decision: a monolithic handler shares a single initialization lifecycle, which means the PostgreSQL connection pool is created once per warm Lambda instance and reused across requests. Per-route Lambdas would each maintain their own cold start and their own pool, multiplying connection overhead against the database.

The trade-off is coarser deploy granularity — any change deploys the entire handler. At this scale, that's acceptable.

### Connection Pooling

Lambda connects to PostgreSQL via a **`pg` connection pool initialized at module load time** (outside the handler function). This means a warm Lambda instance reuses existing connections across invocations rather than opening a new connection per request. The known limitation is that under high concurrency, multiple Lambda instances each maintain their own pool — a case where RDS Proxy would help. That's documented in Limitations.

### Authentication

Every request passes through an **API Gateway Lambda Authorizer** backed by **Firebase Admin SDK**. The authorizer validates the Firebase JWT, extracts the user ID, and injects it into the request context. Business logic never handles raw tokens.

### Request Flow

```
Client Request
  → API Gateway
  → Lambda Authorizer (Firebase token validation)
  → Route Handler
  → Service Layer (business logic + conflict resolution)
  → Drizzle ORM
  → PostgreSQL (ACID transaction)
  → Response
```

---

## API Reference

The API surface covers four domains: **events** (the core sync mechanism), **budgets**, **user profile**, and **public profiles**.

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/events` | Submit a batch of events (max 25). Processed in order; stops on first error. |
| `GET` | `/events?budgetId=&key=&count=` | Fetch ordered event stream for inbox (long-poll cursor-based). |

### Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/budget` | Create a new budget |
| `GET` | `/budgets?key=&count=` | List budgets for authenticated user (paginated) |
| `GET` | `/budgets/:budgetId` | Get full budget snapshot |
| `GET` | `/budgets/:budgetId/join` | Join a shared budget via invite link |
| `DELETE` | `/budgets/:budgetId/leave` | Leave a shared budget |
| `GET` | `/budgets/:budgetId/last-event-sequence` | Get last processed sequence number (sync cursor) |
| `GET` | `/budgets/:budgetId/participants` | List all participants |
| `GET` | `/budgets/:budgetId/participants/:participantId` | Get single participant |
| `GET` | `/budgets/:budgetId/categories` | List all categories |
| `GET` | `/budgets/:budgetId/categories/:categoryId` | Get single category |
| `GET` | `/budgets/:budgetId/expenses/:expenseId` | Get single expense |

### User Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/user` | Get authenticated user's profile |
| `PUT` | `/user` | Update profile fields |
| `GET` | `/user/photo-upload-url` | Get S3 presigned URL for photo upload |
| `POST` | `/user/confirm-photo-upload` | Confirm upload complete, update profile record |
| `DELETE` | `/user/profile-photo` | Remove profile photo |
| `GET` | `/profiles/:userId` | Get any user's public profile |

### Profile Photo Upload Flow

Direct-to-S3 upload avoids routing binary data through Lambda:

```
Client → GET /user/photo-upload-url → receives presigned S3 URL
Client → PUT <presigned URL> (uploads directly to S3)
Client → POST /user/confirm-photo-upload → Lambda updates DB record
User   → photo served via CloudFront CDN
```

---

## Event Processing Model

### What an Event Is

Every client action is represented as an **immutable event** with a globally unique `eventId`. Events describe *what happened*, not *what the new state should be*.

```json
{
  "eventId": "d0e9f472-0992-4841-a43a-537b9a89d9b6",
  "eventType": "expense.add",
  "budgetId": "64143031-e16c-4c97-859d-8997e94ed98e",
  "recordId": "813667ca-8a40-4678-9602-f198d86eff1e",
  "when": 1774718381798,
  "amount": "150.00",
  "note": "coffee",
  "date": "2025-05-06"
}
```

Create events carry no version. Update and delete events must include the current version — this is how conflicts are detected.

### Processing Pipeline

```
Receive batch → Validate schema → For each event (in order):
  ├── Check accepted_events for duplicate eventId
  │     └── Duplicate → return cached result, skip processing
  ├── Check entity version (update/delete only)
  │     └── Mismatch → return latest record, stop batch
  ├── Apply change within ACID transaction
  │     ├── Write to entity table (budget / category / expense)
  │     └── Write to accepted_events (idempotency record)
  └── Return result for this event
```

### Batch Error Behaviour

Events in a batch are processed **sequentially in submission order**. If an event fails (version mismatch, validation error), processing stops at that point. Events already successfully processed in the same batch are **not rolled back** — they are committed and their results are included in the response. The client receives a partial success response and can resume from the failed event.

This mirrors how the Android client's Outbox worker handles partial batch responses — it deletes confirmed events and retries from the failure point.

### Idempotency

`accepted_events` has a unique constraint on `eventId`. If a client retries a previously processed event (e.g., network dropped after the server responded), the server detects the duplicate, returns the original cached result, and skips reprocessing. **Retries are always safe.**

---

## Conflict Resolution

Each entity row carries a **server-assigned version number**, incremented on every accepted mutation. The server is the only system that assigns versions.

### Resolution Table

| Scenario | Server Action | Client Response |
|----------|--------------|-----------------|
| Version matches | Apply event, increment version, return updated record | Apply response to local DB |
| Version mismatch | Return current latest record (no mutation) | Overwrite local record with server state |
| Duplicate `eventId` | Return original cached response | Treat as success, move on |
| Client needs full state | `GET /budgets/:id` snapshot | Replace local data entirely |

### Why This Approach

Version-based resolution is simpler than CRDT or operational transform strategies — there's no merge logic to implement or test. The trade-off is that the losing client's change is silently discarded rather than merged. For a budgeting app where precision matters over leniency, this is the correct trade-off.

---

## Database Design

Normalized relational schema in PostgreSQL. All mutations use ACID transactions.

### Schema

```
users
  └── id (PK)
  └── ...profile fields

budgets
  └── id (PK)
  └── owner_id (FK → users)

participants
  └── budget_id (FK → budgets)   ← composite PK
  └── user_id   (FK → users)     ←

categories
  └── id (PK)
  └── budget_id (FK → budgets)
  └── version

expenses
  └── id (PK)
  └── category_id (FK → categories)
  └── created_by  (FK → users)
  └── version

accepted_events
  └── event_id (PK / unique) ← idempotency enforcement
  └── budget_id
  └── response_payload        ← cached for duplicate requests
  └── processed_at
```

### Relationships

- `User` → owns many `Budgets`
- `Budget` → has many `Participants` (join table with `users`)
- `Budget` → has many `Categories`
- `Category` → has many `Expenses`
- `Expense` → belongs to one `User` (creator)
- `accepted_events` → stores every processed `eventId` with its response payload for idempotent replay

### Version Column

All `budgets`, `categories` and `expenses` carry a `version` integer. The server increments this on every accepted update or delete. Clients must echo the current version in mutation events — a mismatch is the conflict signal.

---

## Cloud Infrastructure

All resources are provisioned and managed via **Terraform**. No manual console configuration.

### Resources

| Resource | Purpose |
|----------|---------|
| **API Gateway** | HTTP entrypoint, routes to Lambda, hosts authorizer |
| **Lambda** | Monolithic request handler (Node.js runtime) |
| **Lambda Authorizer** | Firebase JWT validation per request |
| **PostgreSQL (by Avien)** | Primary data store. Explore more about [Avien](https://aiven.io/postgresql). |
| **S3 Bucket** | Profile photo storage (presigned upload target) |
| **CloudFront** | CDN for serving profile photos |
| **IAM Roles & Policies** | Least-privilege access for Lambda and S3 |
| **CloudWatch** | Lambda execution logging |

### Environment

Currently a single production environment. Multi-environment (dev/staging/prod) Terraform workspace separation is on the roadmap.

---

## CI/CD Pipeline

Implemented with **GitHub Actions**, triggered on push to main.

### Pipeline Steps

```
Push to main
  │
  ├── 1. TypeScript build check (tsc — no emit)
  │         Fails fast on type errors before any deployment
  │
  ├── 2. Apply Terraform changes
  │         Infrastructure changes applied first (e.g. new env vars, IAM)
  │
  └── 3. Deploy database migrations
            Drizzle migrations run against production DB
            Lambda deployment follows after schema is current
```

**Deploy only triggers on main.** Feature branches run the build check only.

The ordering matters: infrastructure is updated before migrations, and migrations run before the new Lambda code is live — preventing the new handler from running against a stale schema.

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Node.js | Lightweight Lambda execution, fast cold starts |
| Language | TypeScript | Type safety across API contracts and DB schema |
| ORM | Drizzle | TypeScript-native, schema-as-code, migration tooling |
| Database | PostgreSQL | ACID transactions, referential integrity, versioning |
| Auth | Firebase Admin SDK | Offloads user management; JWT validation in authorizer |
| Storage | AWS S3 + presigned URLs | Binary uploads bypass Lambda; no size or timeout limits |
| CDN | CloudFront | Low-latency profile photo delivery |
| Infrastructure | Terraform | Reproducible, version-controlled infra |
| CI/CD | GitHub Actions | Build check + infra + migration pipeline on push |

---

## Project Structure

```
src/
  ├── routes/           ← API Gateway route handlers (one file per domain)
  ├── services/         ← Business logic (event processing, conflict resolution)
  ├── db/               ← Drizzle schema definitions and query helpers
  └── middleware/       ← Auth context extraction, error handling

drizzle/
  └── migrations/       ← Generated migration files (version-controlled)
  └── seed/            ← Sample data

terraform/
  ├── main.tf           ← Lambda, API Gateway, IAM
  ├── storage.tf        ← S3, CloudFront
  └── variables.tf

scripts/                ← Utility scripts (seed, migration runner)
```

---

## Setup & Installation

### Prerequisites

- Node.js 22+
- Docker (local PostgreSQL)
- AWS CLI configured with credentials
- Firebase project with Admin SDK service account

### Local Development

```bash
git clone https://github.com/rahulstech/budget-app-backend.git
cd budget-app-backend
npm install
```

Rename `example.env` to `dev.env` with. Fill necessary fileds. Comment unnecessary field.

Start local database:

```bash
docker run -d \
  --name budgetdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=budget_db \
  -p 5432:5432 \
  postgres:15
```

Run migrations and start server:

```bash

# create tables 
npm run drizzle:migrate

# (optional) add fake users
npm run drizzle:seed:fake_users

# start development server
npm run dev
```

### Deploying to AWS

Ensure Terraform is initialized and AWS credentials are set Push to master — the CI/CD pipeline handles the rest.

---

## Testing

### Current State

Manual API testing via Postman, covering:

- Valid event submission (single and batch)
- Duplicate `eventId` — verifies idempotent response
- Version mismatch on update/delete — verifies latest record returned
- Partial batch — verifies stop-on-error behaviour and partial response
- Long-poll event fetch with sequence cursor
- Snapshot download via budget GET

### What Needs Automated Tests (and Why)

The highest-risk logic in this system is the event processing pipeline and conflict resolution — both are pure functions over database state and are straightforward to unit test with a test database or mocked Drizzle client.

Priority test targets:

| Target | Type | Why |
|--------|------|-----|
| Idempotency check | Unit | Core correctness guarantee |
| Version conflict path | Integration | Most complex branching logic |
| Partial batch response | Integration | Client depends on exact response shape |
| Schema migrations | Migration test | Prevents data loss on deploy |

This is the most significant gap in the current project and the first area for improvement.

---

## Limitations & Trade-offs

### Connection Pooling Under Concurrency

Lambda connection pools are per-instance. Under high concurrency, multiple warm Lambda instances each hold their own pool, which can exhaust PostgreSQL's connection limit. **RDS Proxy** would sit between Lambda and PostgreSQL and multiplex connections — the right next step if concurrency scales.

### Stop-on-First-Error Batch Processing

The current batch model stops at the first failing event. This is simple and predictable, but means a single version conflict blocks the rest of a batch. An alternative is to process all events independently and return a per-event result map — more complex to implement on both client and server, but more efficient for large batches with isolated failures.

### No Real-Time Push

The inbox model uses client-initiated long polling. The server has no mechanism to push changes to connected clients. This means update propagation latency is bounded by the polling interval, not by the event arrival time. WebSockets or Server-Sent Events would close this gap.

### Single Environment

Terraform currently manages one environment. There's no dev/staging separation, which means infrastructure changes go directly to production.

### No Automated Tests

Covered in the Testing section above. This is the most important gap for production readiness.

---

## Roadmap

| Priority | Item | Reason |
|----------|------|--------|
| High | Integration tests for event pipeline and conflict resolution | Core correctness, highest-risk code |
| High | RDS Proxy | Prevent connection exhaustion under Lambda concurrency |
| Medium | Per-event batch result map (replace stop-on-first-error) | More resilient client sync |
| Medium | Cursor-based pagination standardization across all list endpoints | Consistency and scalability |
| Medium | Terraform multi-environment (dev/staging/prod) | Safe infra changes |
| Medium | Delta sync endpoint | Avoid full snapshot on every client join |
| Low | Authorization result caching | Reduce Firebase SDK call per request |
| Low | Reporting and analytics endpoints | Category-wise spending summaries |

---

## 👤 Author — Rahul Bagchi

Backend and Android developer focused on distributed systems and offline-first architecture. Built both sides of this system — the Android client and this backend — as a cohesive end-to-end exploration of sync reliability and eventual consistency.

- **GitHub**: [rahulstech](https://github.com/rahulstech)
- **LinkedIn**: [Rahul Bagchi](https://www.linkedin.com/in/rahul-bagchi-176a63212/)
- **Email**: rahulstech18@gmail.com
- **Android counterpart**: [budget-app-android](https://github.com/rahulstech/budget-app-android)

Open to backend, Android, and full-stack roles — particularly where distributed data or sync complexity is part of the problem.
