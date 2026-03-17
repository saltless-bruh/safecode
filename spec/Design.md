# SafeCode Design

Source of truth: `PROJECT_PROPOSAL.md`

## 1. Architecture Overview

SafeCode uses control-by-architecture:
- Hosted Core Engine executes protected logic.
- License/Policy Service controls entitlements and policy state.
- Thin Node Connector calls hosted APIs and handles token lifecycle.
- Dashboard enables deal, review, policy, credit, and audit workflows.
- Observability/Audit stores immutable operational and security events.

## 2. Core Components

### 2.1 API Gateway / BFF
Responsibilities:
- authenticate requests
- authorize role access
- attach request context (`requestId`, tenant, actor)
- route to backend services
- normalize errors

### 2.2 Verification Service
Responsibilities:
- create deals and transfer reference codes
- accept proof submissions
- verify/reject proofs
- expire stale deals
- emit verification audit events

### 2.3 Entitlement Service
Responsibilities:
- issue signed short-lived entitlement JWT
- refresh entitlement when policy/credit rules pass
- revoke entitlements
- validate offline lease windows
- expose entitlement status

### 2.4 Metering Service
Responsibilities:
- compute credit consumption
- debit/grant/top-up ledger operations
- enforce insufficient credit deny path
- expose balance and usage summaries

### 2.5 Notification Service
Responsibilities:
- send activation notifications
- send low balance alerts
- send policy change notices

### 2.6 Connector SDK (Node)
Responsibilities:
- initialize tenant/project/env context
- fetch and refresh entitlement
- execute protected operation via hosted API
- handle deny responses and offline lease behavior

## 3. Logical Data Model

Tables:
- `users`, `tenants`, `projects`
- `deals`, `payment_proofs`
- `entitlements`
- `credit_ledgers`
- `audit_events`

Key relations:
- `deals` link freelancer tenant, client tenant, and project
- `payment_proofs` link to `deals`
- `entitlements` link to deal, tenant, and project
- `credit_ledgers` track tenant/project usage and balances

## 4. State Machines

### 4.1 Payment Verification
- `pending -> submitted`
- `submitted -> verified | rejected`
- `pending|submitted -> expired`
- `rejected -> submitted`

Guards:
- only reviewer/admin can set `verified|rejected`
- entitlement issuance requires `verified`

### 4.2 Entitlement Lifecycle
- `none -> issued`
- `issued -> expired | revoked`
- `expired|revoked -> issued` after valid re-check

Guards:
- revoked policy blocks refresh and protected execution

## 5. Token Design (Locked MVP)

JWT signed with `EdDSA`.

Header:
- `alg`, `typ`, `kid`

Claims:
- identity/time: `sub`, `jti`, `iat`, `nbf`, `exp`
- issuer/audience: `iss`, `aud`
- scope/context: `tenant_id`, `project_id`, `deal_id`, `env`, `scope`
- policy/lease: `policy_state`, `lease_until`

Validation:
- reject expired tokens
- reject revoked policy tokens
- reject environment mismatch
- reject revoked `jti`

## 6. Credit Rating Design (Locked MVP)

Formula:
`credits_used = base_cost + size_factor + complexity_factor + environment_factor`

Constants:
- `base_cost = 1`
- size: `S=0`, `M=1`, `L=3`, `XL=6`
- complexity: `validate=0`, `execute=2`, `batch_execute=5`
- environment: `dev=0`, `staging=1`, `prod=2`

Tier grants:
- free: 300/month
- starter: 2,000/month
- pro: 10,000/month

## 7. Upload and Proof Handling Design

File policy:
- types: JPEG/PNG/PDF
- max size: 8 MB
- one file per submission
- malware scan before `submitted`

Conflict policy:
- max 3 attempts
- `submitted` replacement marks prior as `superseded`
- `verified` blocks re-upload
- `expired` requires reviewer reopen
- optimistic lock for reviewer decisions

## 8. Environment Matrix

Environment-specific differences:
- token TTL: dev 60m, staging 30m, prod 15m
- lease window: dev 72h, staging 48h, prod 24h
- rate limits: dev 600, staging 300, prod 120 req/min/tenant
- stricter redaction, alerting, and CORS in higher environments

Control rules:
- prod config changes require approval + audit event
- secrets are environment-scoped

## 9. Deployment Topology

Services:
- API Gateway/BFF
- Deal/Verification Service
- Entitlement Service
- Credit Metering Service
- Notification Service

Infrastructure:
- PostgreSQL
- Redis
- object storage for receipts
- worker queue for async notifications/reports

## 10. Non-Functional Design Constraints

- secure-by-default design
- deterministic state transitions
- reproducible deployment via migrations and runbooks
- observability baseline: `/healthz`, `/metrics`, structured logs
- immutable audit trail for compliance and disputes
