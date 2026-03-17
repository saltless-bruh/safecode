# TECHNICAL ARCHITECTURE & ENGINEERING PROPOSAL: SAFECODE

**Zero-Trust Code Execution & DRM (Digital Rights Management) System for Node.js Ecosystems**

## 1. SYSTEM OVERVIEW

**SafeCode** is an IP protection and license enforcement platform for freelance engineers.

The core strategy is **Control-by-Architecture**:

- sensitive logic runs only on SafeCode-hosted infrastructure,
- clients receive a thin connector SDK/sidecar for integration,
- access is governed through signed, short-lived entitlements and policy checks.

This design avoids shipping crown-jewel algorithms into untrusted client environments and provides auditable control over usage, revocation, and license state.

## 2. TECHNICAL CHALLENGES & THREAT MODEL

When deploying code to an untrusted environment (the client's server), we assume the client has root access. Our threat model addresses the following vectors:

1. **Connector Reverse Engineering:** Attackers inspect the on-prem connector binary/package to discover internal behavior or bypasses.

2. **Token Replay and MITM Manipulation:** Attackers capture entitlement tokens or signed requests and attempt replay or request tampering.

3. **Credential Theft and API Abuse:** Attackers leak API credentials and automate abusive traffic against hosted endpoints.

4. **Offline Circumvention Attempts:** Attackers attempt to continue operation beyond policy limits by forcing disconnected/offline execution paths.

5. **Operator/Policy Misconfiguration:** Legitimate admins accidentally apply unsafe or overly broad policy changes.
    

## 3. CORE TECHNICAL PILLARS & ARCHITECTURE

The v2 system is decoupled into five primary modules:

### 3.1. Hosted Core Engine (SafeCode Cloud)

Runs proprietary business logic, transformation pipelines, and validation workflows entirely on SafeCode-managed infrastructure.

- **Versioned APIs:** Exposes endpoints such as `/v1/execute`, `/v1/validate`, and `/v1/jobs`.
- **Isolation:** Tenant-scoped runtime boundaries to prevent cross-tenant data leaks.
- **No Crown-Jewel Distribution:** Sensitive algorithms are not deployed to client servers.

### 3.2. License and Policy Service

Centralized control layer for entitlement issuance and usage policy.

- **Entitlements:** Issues short-lived signed tokens (JWT/PASETO) with scope, tenant, project, and environment claims.
- **Policy Controls:** Supports active/suspended/revoked states, quotas, and feature flags.
- **Revocation:** Soft revoke blocks new sessions; hard revoke denies calls after grace-window expiry.

### 3.3. Thin Client Connector (Node SDK + Optional Sidecar)

Local integration runtime for customer systems.

- **Connector Responsibilities:** Auth handshake, request signing, retries, and response verification.
- **Resilience:** Supports offline lease handling for temporary service outages.
- **Minimal IP Exposure:** Contains integration code only, not sensitive algorithmic source.

### 3.4. Control Plane Dashboard

Web UI for freelancers/admins to operate projects safely.

- Manage tenants, plans, quotas, and policy states.
- Review audit trails and deny reasons.
- Perform policy updates with reason codes (not destructive kill operations).

### 3.5. Observability and Audit

Security and operations telemetry for reliability and dispute handling.

- Immutable event logs for entitlement issuance, denials, policy updates, and revocations.
- Metrics for anomaly detection, abuse monitoring, and capacity planning.
- Forensic traceability for enterprise/security review.
    

## 4. TECHNOLOGY STACK & FRAMEWORKS

To achieve low-latency API responses and robust security, we enforce the following stack:

**A. Hosted Core Engine:**

- **Runtime:** **NestJS** (TypeScript) or **Go** (Fiber/Gin) for high-concurrency API execution.

- **Data Layer:** **PostgreSQL** for tenants, projects, plans, and policy state.

- **Caching/Queueing:** **Redis** for rate limiting, short-lived cache, and background job coordination.

- **Secrets and Keys:** **HashiCorp Vault** or **AWS KMS** for signing keys and rotation workflows.
    

**B. License and Policy Services:**

- **Entitlement Format:** JWT or PASETO with short TTL and scoped claims.

- **Policy Engine:** State transitions (`active`, `suspended`, `revoked`), quotas, and feature flags.

- **Abuse Controls:** Tenant quotas, anomaly checks, and revocation workflows.

- **Auditability:** Immutable policy and entitlement events.

**C. Thin Connector (Node SDK + Optional Sidecar):**

- **SDK Language:** TypeScript/Node.js for easy customer integration.

- **Connector Functions:** Auth handshake, token refresh, request signing, retries, and offline lease handling.

- **Transport Security:** TLS + nonce/timestamp + signature validation.
    

**D. Frontend (Freelancer Dashboard):**

- **Framework:** **Next.js** (App Router) with React.
    
- **Styling & State:** TailwindCSS + Zustand or Redux Toolkit.
    
- **Authentication:** NextAuth.js or Firebase Auth.
    

**E. Optional Future Modules (Post-MVP):**

- AI legal assistant, automated email generation, and advanced analytics are optional extensions after core licensing and policy controls are stable.
    

## 5. ENGINEERING ROADMAP

**Phase 1: Functional PoC (Weeks 1-4)**

- Build a hosted API with one proprietary workflow endpoint.
- Implement basic entitlement issuance and verification with short TTL tokens.
- Deliver a minimal Node connector that can call the hosted workflow.

**Phase 2: MVP (Weeks 5-9)**

- Build dashboard controls for policy state (`active`, `suspended`, `revoked`) and quotas.
- Add audit events for allow/deny and policy changes.
- Implement offline lease support (24-72h window) and predictable post-expiry deny behavior.
- Add Redis-based rate limiting and abuse controls.

**Phase 3: Hardening and Demo Readiness (Weeks 10-14)**

- Add replay protection (nonce/timestamp), request signing, and key rotation process.
- Add tenant-level monitoring, alerting, and anomaly heuristics.
- Finalize demo flows: onboarding, entitlement flow, revocation, and outage handling.

**Out of Scope for Semester MVP**

- anti-debug crash logic,
- wasm obfuscation hardening,
- custom packer/loader runtime,
- AI legal assistant and email generation modules.
        

## 6. THREAT MITIGATION (DEV-TO-DEV SPECIFICS)

- **Threat: Local reverse engineering in client environment**
    - _Countermeasure:_ Keep crown-jewel logic server-side; ship only thin connector logic.

- **Threat: Entitlement/token replay attacks**
    - _Countermeasure:_ Use short-lived tokens plus nonce/timestamp validation and request signatures.

- **Threat: API abuse and credential leakage**
    - _Countermeasure:_ Rate limiting, tenant quotas, scoped tokens, anomaly detection, and rapid revocation.

- **Threat: License service outage causing customer downtime**
    - _Countermeasure:_ Signed offline lease window with controlled degradation and explicit post-expiry behavior.

- **Threat: Policy misuse or operator error**
    - _Countermeasure:_ Role-based access, reason-coded policy changes, and immutable audit logs.

## 7. DESIGN RATIONALE (V2 SUMMARY)

This proposal adopts a control-by-architecture model because it is the most practical way to protect IP in untrusted client environments while staying deployable for a student startup team.

- **Protection strategy:** Keep crown-jewel logic hosted and ship only a thin connector.
- **Enforcement strategy:** Use signed short-lived entitlements, policy states, quotas, and auditable revocation.
- **Reliability strategy:** Prefer graceful degradation with offline lease windows over immediate hard shutdown.

This does not claim mathematically unbreakable protection on client-owned machines. The practical objective is to make unauthorized use materially harder, operationally visible, and contractually enforceable.

## 8. NON-CUSTODIAL PAYMENT VERIFICATION FLOW

SafeCode does not collect or custody client funds. Payments are made directly to the freelancer using the freelancer's own bank QR code. SafeCode only links externally settled payments to license entitlement issuance.

### 8.1. Payment and Activation Sequence

1. Freelancer creates a deal in SafeCode and receives a unique `Deal ID` + `Transfer Reference` code.
2. Freelancer shares deliverable package + bank QR + transfer reference instructions with client.
3. Client pays directly to freelancer bank account and includes the transfer reference in payment notes (when supported).
4. Client submits payment proof in SafeCode (receipt screenshot + amount + timestamp + sender account hint).
5. SafeCode runs verification workflow (manual in MVP, semi-automated/automated in later phases).
6. After verification status becomes `verified`, SafeCode issues entitlement automatically.
7. Connector activates and all events are recorded in immutable audit logs.

Note: Email is used for notification and activation links only. SafeCode does not send long-lived raw license keys via email.

### 8.2. Verification States

- `pending`: Deal created, payment proof not submitted.
- `submitted`: Client uploaded payment proof; awaiting validation.
- `verified`: Payment evidence accepted; entitlement released.
- `rejected`: Evidence invalid or mismatched; no entitlement issued.
- `expired`: Verification window exceeded; deal requires refresh/reopen.

### 8.3. MVP vs Phase-2 Verification

**MVP (recommended for student team):**

- Manual verification by freelancer/admin in dashboard.
- Required fields: amount, transfer time, transfer reference, receipt upload.
- Two-person confirmation option for high-value deals.

**Phase 2 (automation):**

- OCR extraction from receipt images.
- Rule engine for amount/time/reference matching.
- Optional bank feed or payment provider webhook integration where available.
- Risk scoring and human review for suspicious submissions.

### 8.4. Fraud and Dispute Controls

- Entitlement release only after `verified` state.
- Enforce strict reference-code matching for reduced ambiguity.
- Keep all verification decisions with reviewer identity and timestamp.
- Support one-click entitlement suspension if payment is later disputed.

### 8.5. Product Positioning Statement

SafeCode is a non-custodial trust and licensing platform. It does not process payments; it verifies payment evidence and automates entitlement release according to policy.

### 8.6. Client Key Delivery and Activation Policy

- **Primary method:** Authenticated entitlement retrieval via SafeCode portal/API.
- **Email role:** Notify client that verification is complete and provide a short-lived activation link.
- **Security rule:** Do not send long-lived raw keys in email content.
- **Runtime behavior:** Connector retrieves short-lived tokens directly from SafeCode and refreshes them as needed.
- **Fallback path:** If mail delivery is delayed, client can sign in to the portal and activate manually.

## 9. API CONTRACT (MVP)

The following API contract is intentionally small so a 6-member student team can build and test it within one semester.

### 9.1. `POST /v1/deals`

Creates a new freelancer-client deal and generates a unique transfer reference.

- Request body:
    - `freelancerId`
    - `clientId`
    - `projectId`
    - `amount`
    - `currency`
- Response:
    - `dealId`
    - `transferReference`
    - `status` (`pending`)

### 9.2. `POST /v1/payments/proof`

Client submits external payment evidence.

- Request body:
    - `dealId`
    - `amount`
    - `transferTimestamp`
    - `transferReference`
    - `receiptFileUrl`
- Response:
    - `status` (`submitted`)
    - `reviewRequired` (`true` for MVP)

### 9.3. `POST /v1/payments/verify`

Reviewer confirms or rejects submitted proof.

- Request body:
    - `dealId`
    - `decision` (`verified` | `rejected`)
    - `reasonCode`
- Response:
    - `status`
    - `verifiedAt` (if verified)

### 9.4. `POST /v1/entitlements/issue`

Issues short-lived entitlement after verified payment.

- Request body:
    - `dealId`
    - `tenantId`
    - `projectId`
    - `environment`
- Response:
    - `token`
    - `expiresAt`
    - `scope`

### 9.5. `GET /v1/entitlements/status?dealId=...`

Returns current entitlement and policy status for connector/client dashboard.

- Response:
    - `policyState` (`active` | `suspended` | `revoked`)
    - `entitlementState` (`none` | `issued` | `expired`)
    - `leaseUntil` (nullable)

### 9.6. Standard Error Shape

All endpoints return consistent errors:

- `code` (example: `PROOF_MISMATCH`, `DEAL_NOT_FOUND`, `POLICY_REVOKED`)
- `message`
- `requestId`
- `timestamp`

## 10. OPERATING POLICIES AND METRICS

### 10.1. MVP Operating Policies

- **Activation target:** verified payment to issued entitlement in under 5 minutes.
- **Offline lease window:** 24 hours default, configurable up to 72 hours.
- **Post-lease behavior:** deny new protected operations until re-validation succeeds.
- **Review policy:** high-value deals require two-person approval.
- **Audit retention:** keep entitlement and verification events for at least 12 months.

### 10.2. Roles and Permissions

- **Freelancer Owner:** create deals, view proofs, request review.
- **Reviewer/Admin:** verify/reject proofs, suspend/revoke policy state.
- **Client Admin:** submit proof, activate connector, view entitlement status.
- **Read-Only Auditor:** view logs and decisions, cannot mutate policy.

### 10.3. Security and Reliability KPIs

- **Activation Success Rate:** percentage of verified deals that activate successfully.
- **Median Verification-to-Activation Time:** end-to-end entitlement release speed.
- **False Acceptance Rate:** invalid proof incorrectly marked verified.
- **False Rejection Rate:** valid proof incorrectly rejected.
- **Outage Resilience Rate:** connector continuity during temporary license-service outages.

### 10.4. Demo Acceptance Criteria

- Create deal and transfer reference.
- Submit proof and verify decision in dashboard.
- Observe automatic entitlement issuance and connector activation.
- Simulate policy suspension and show controlled deny behavior.
- Show full audit trail for every step above.

## 11. TOKEN-CREDIT MONETIZATION MODEL

SafeCode uses a credit-based usage model:

- All new accounts receive a free starter credit balance.
- Usage consumes credits.
- Users buy top-ups or upgrade plans when credits run low.

### 11.1. Billing Units

Credits are consumed per protected operation using a weighted formula.

`credits_used = base_cost + size_factor + complexity_factor + environment_factor`

- `base_cost`: minimum credits charged per operation.
- `size_factor`: based on project size bucket.
- `complexity_factor`: based on operation type (simple validation vs heavy execution).
- `environment_factor`: optional multiplier for production environments.

### 11.2. Project Size Measurement (MVP Policy)

For MVP, keep measurement deterministic and simple:

- Primary metric: total source size in KB for selected protected modules.
- Size buckets (example):
    - `S`: <= 500 KB
    - `M`: 501 KB - 2 MB
    - `L`: 2 MB - 10 MB
    - `XL`: > 10 MB
- Bucket is captured at deal/project setup and re-evaluated only on explicit re-scan.

This keeps billing predictable and avoids per-request recalculation overhead.

### 11.3. Free Tier and Paid Tiers

- **Free tier:** limited monthly credits for prototype/testing usage.
- **Starter tier:** larger monthly credit pool + low-cost top-ups.
- **Pro tier:** higher pool, priority support, better rate per credit.
- **Enterprise tier:** custom quotas, SLAs, and invoiced billing.

### 11.4. Top-Up and Balance Rules

- Credits are deducted at operation time.
- If balance is insufficient:
    - deny new protected operation,
    - return `INSUFFICIENT_CREDITS`,
    - direct user to top-up/upgrade flow.
- Add configurable low-balance alerts (for example at 20 percent and 10 percent).

### 11.5. Transparency and Anti-Dispute Controls

- Every credit deduction creates an auditable usage event.
- Dashboard shows:
    - current balance,
    - credits used by project,
    - per-endpoint usage,
    - projected depletion date.
- Invoice/export includes metering inputs (operation type, bucket, timestamp, credits).

### 11.6. MVP Scope Recommendation

For semester MVP, implement only:

1. Free credits on signup.
2. Manual top-up simulation in admin panel.
3. Deterministic size bucket assignment.
4. Per-operation credit deduction and insufficient-credit deny path.
5. Basic usage dashboard and CSV export.

## 12. ASSUMPTIONS AND NON-GOALS

### 12.1. Assumptions

- Client runtime environments are untrusted and may have full admin/root access.
- SafeCode controls hosted core services and entitlement issuance.
- Payment settlement happens outside SafeCode (direct bank transfer via freelancer QR).
- MVP verification is primarily manual with structured evidence checks.

### 12.2. Non-Goals (Semester MVP)

- Acting as payment processor, escrow custodian, or banking intermediary.
- Guaranteeing mathematically unbreakable protection on client-owned machines.
- Full automation of bank verification across all regions.
- Native support for every language runtime beyond initial Node connector target.

## 13. DATA MODEL (MVP)

The schema below is intentionally relational and normalized for PostgreSQL.

### 13.1. `users`

- `id` (pk)
- `email` (unique)
- `role` (`freelancer_owner` | `reviewer_admin` | `client_admin` | `auditor`)
- `created_at`

### 13.2. `tenants`

- `id` (pk)
- `name`
- `owner_user_id` (fk -> users)
- `plan_tier` (`free` | `starter` | `pro` | `enterprise`)
- `created_at`

### 13.3. `projects`

- `id` (pk)
- `tenant_id` (fk -> tenants)
- `name`
- `size_bucket` (`S` | `M` | `L` | `XL`)
- `size_kb_snapshot`
- `created_at`

### 13.4. `deals`

- `id` (pk)
- `freelancer_tenant_id` (fk -> tenants)
- `client_tenant_id` (fk -> tenants)
- `project_id` (fk -> projects)
- `amount`
- `currency`
- `transfer_reference` (unique)
- `status` (`pending` | `submitted` | `verified` | `rejected` | `expired`)
- `created_at`

### 13.5. `payment_proofs`

- `id` (pk)
- `deal_id` (fk -> deals)
- `receipt_file_url`
- `submitted_amount`
- `submitted_transfer_time`
- `submitted_reference`
- `submitted_by_user_id` (fk -> users)
- `review_status` (`submitted` | `verified` | `rejected`)
- `reviewed_by_user_id` (nullable fk -> users)
- `review_reason_code` (nullable)
- `created_at`
- `reviewed_at` (nullable)

### 13.6. `entitlements`

- `id` (pk)
- `deal_id` (fk -> deals)
- `tenant_id` (fk -> tenants)
- `project_id` (fk -> projects)
- `environment` (`dev` | `staging` | `prod`)
- `token_jti` (unique)
- `issued_at`
- `expires_at`
- `state` (`issued` | `expired` | `revoked`)

### 13.7. `credit_ledgers`

- `id` (pk)
- `tenant_id` (fk -> tenants)
- `project_id` (nullable fk -> projects)
- `event_type` (`grant` | `debit` | `topup` | `adjustment`)
- `credits_delta`
- `balance_after`
- `usage_context` (nullable jsonb)
- `created_at`

### 13.8. `audit_events`

- `id` (pk)
- `tenant_id` (fk -> tenants)
- `actor_user_id` (nullable fk -> users)
- `event_type`
- `entity_type`
- `entity_id`
- `payload` (jsonb)
- `request_id`
- `created_at`

## 14. STATE MACHINES

### 14.1. Payment Verification State Machine

- `pending` -> `submitted`: proof uploaded by client.
- `submitted` -> `verified`: reviewer accepts proof.
- `submitted` -> `rejected`: reviewer rejects proof.
- `pending|submitted` -> `expired`: verification window timeout.
- `rejected` -> `submitted`: client re-submits corrected proof.

Guard rules:

- Only reviewer/admin may transition to `verified` or `rejected`.
- `verified` is required before entitlement issuance.

### 14.2. Entitlement Lifecycle State Machine

- `none` -> `issued`: system issues entitlement post-verification.
- `issued` -> `expired`: TTL elapsed.
- `issued` -> `revoked`: policy suspension/revocation action.
- `expired|revoked` -> `issued`: re-issue after successful re-validation.

Guard rules:

- `revoked` cannot be used by connector for protected operations.
- Refresh is blocked when policy is `revoked`.

## 15. SEQUENCE FLOWS (TEXT)

### 15.1. Deal to Activation

1. Freelancer -> API: `POST /v1/deals`
2. API -> DB: create deal + transfer reference
3. Client -> API: `POST /v1/payments/proof`
4. Reviewer -> API: `POST /v1/payments/verify (verified)`
5. API -> Entitlement Service: issue token
6. Connector -> API: fetch entitlement/status
7. Connector: activate protected workflow

### 15.2. Connector Refresh Flow

1. Connector checks local token TTL threshold.
2. Connector calls entitlement refresh endpoint.
3. Service validates policy state + credits + lease.
4. If valid, new short-lived token returned.
5. If invalid, return deny code and reason.

### 15.3. Offline Lease Expiry Flow

1. License service temporarily unreachable.
2. Connector continues within lease window.
3. Lease expiry reached and verification still unavailable.
4. Connector blocks new protected operations.
5. Connector retries periodic re-validation until recovered.

## 16. API OPERATIONAL REQUIREMENTS

### 16.1. Authentication and Authorization

- All mutating endpoints require bearer token auth.
- Role-based checks enforced server-side per endpoint.
- Service-to-service calls use scoped machine credentials.

### 16.2. Idempotency

- `POST /v1/deals`, `POST /v1/payments/proof`, and `POST /v1/entitlements/issue` accept `Idempotency-Key`.
- Duplicate key + same body returns original success response.
- Duplicate key + different body returns conflict error.

### 16.3. Rate Limits

- Default API limit per tenant: configurable requests/minute.
- Stricter limits for verification and entitlement endpoints.
- Return `429` with retry metadata.

### 16.4. Error Catalog (Minimum)

- `AUTH_INVALID`
- `AUTH_FORBIDDEN`
- `DEAL_NOT_FOUND`
- `PROOF_MISMATCH`
- `PROOF_EXPIRED`
- `POLICY_SUSPENDED`
- `POLICY_REVOKED`
- `INSUFFICIENT_CREDITS`
- `LEASE_EXPIRED`
- `RATE_LIMITED`

## 17. SECURITY CONTROL CHECKLIST

- TLS enforced for all external and internal service traffic.
- Signed short-lived entitlements with rotation-ready signing keys.
- Nonce/timestamp replay checks on critical requests.
- Principle of least privilege for service and user roles.
- Immutable audit event logging for sensitive actions.
- Secrets managed by Vault/KMS (no plaintext secrets in repo).
- Upload validation for receipt files (type/size/scanning policy).
- Periodic access review for reviewer/admin privileges.

## 18. DEPLOYMENT TOPOLOGY (MVP)

### 18.1. Services

- API Gateway / BFF
- Deal and Verification Service
- Entitlement Service
- Credit Metering Service
- Notification Service (email)

### 18.2. Infrastructure

- PostgreSQL (primary relational store)
- Redis (cache, limits, short-term locks)
- Object storage for receipt files
- Worker queue for async tasks (notifications, report generation)

### 18.3. Environments

- `dev`: feature testing
- `staging`: end-to-end integration + demo rehearsal
- `prod`: final deployment for pilot usage

## 19. TEAM IMPLEMENTATION PLAN (6 MEMBERS)

### 19.1. Workstreams

1. **Backend Core:** deals, proofs, verification endpoints
2. **Entitlements/Auth:** token issuance, refresh, policy guards
3. **Connector SDK:** integration, refresh logic, offline lease behavior
4. **Dashboard Frontend:** deal management, proof review, status views
5. **Metering/Billing:** credit ledger, usage views, top-up simulation
6. **QA/DevOps:** test harness, CI pipeline, staging environment, docs

### 19.2. Milestone Deliverables

- Week 4: deal + proof submission flow complete
- Week 8: verification -> entitlement issuance working end-to-end
- Week 10: credit deduction and insufficient-credit deny path working
- Week 12: connector offline lease behavior validated
- Week 14: final demo script + metrics dashboard + technical report

## 20. TEST STRATEGY

### 20.1. Unit Tests

- State transition validators
- Credit deduction formula
- Policy guard checks

### 20.2. Integration Tests

- API + DB consistency for deal/proof/entitlement flows
- Idempotency behavior
- Rate-limit behavior and 429 responses

### 20.3. End-to-End Tests

- Full path: deal creation -> proof -> verify -> activation
- Policy suspension/revocation impact on connector
- Offline lease continuation then expiry deny behavior

### 20.4. Abuse and Fraud Tests

- Reused receipt upload attempt
- Mismatched transfer reference
- Replay attempt with stale nonce/timestamp
- Rapid repeated entitlement requests

## 21. OPEN RISKS AND MITIGATIONS

### 21.1. Risk Register (MVP)

1. **Fake receipt fraud**
    - Mitigation: mandatory reference matching, reviewer checklist, two-person rule for high-value deals.
    - Owner: Verification workstream.

2. **Scope creep across features**
    - Mitigation: strict MVP backlog lock after week 5.
    - Owner: Project lead.

3. **Connector reliability under outages**
    - Mitigation: lease logic tests in CI and chaos-style service interruption tests.
    - Owner: Connector + QA workstreams.

4. **Role misuse / accidental revocation**
    - Mitigation: role separation, reason codes, and reversible suspension flow.
    - Owner: Auth/Policy workstream.

5. **Inconsistent usage billing perceptions**
    - Mitigation: deterministic bucket policy + transparent credit ledger exports.
    - Owner: Metering workstream.

## 22. ARCHITECTURE DIAGRAMS (ASCII)

### 22.1. System Context Diagram

```text
                                                +--------------------------------+
                                                |        Freelancer Dashboard    |
                                                |  (Deal setup, review, policy)  |
                                                +---------------+----------------+
                                                                                |
                                                                                | HTTPS (Auth)
                                                                                v
+------------------+      +-------------+--------------+      +-------------------+
|  Client App      |      |       API Gateway / BFF    |      |  Client Admin UI  |
| + Node Connector |----->|  AuthN/AuthZ + Routing     |<-----| (Proof upload,    |
|                  |      +------+------+------+-------+      | status, activate) |
+------------------+             |      |      |              +-------------------+
                 |                        |      |      |
                 |                        |      |      +------------------------------+
                 |                        |      |                                     |
                 v                        v      v                                     v
+------------------+    +---------------------+   +---------------------+   +------------------+
| Entitlement Svc  |    | Deal/Verification   |   | Credit Metering Svc |   | Notification Svc |
| issue/refresh    |    | deals, proofs,      |   | debit/grant/topup   |   | email links      |
| lease checks     |    | reviewer decisions  |   | balance checks      |   | alerts           |
+--------+---------+    +----------+----------+   +----------+----------+   +--------+---------+
                 |                           |                         |                       |
                 +-------------+-------------+-------------------------+-----------------------+
                                             |
                                             v
            +----------------+----------------+      +------------------+
            | PostgreSQL (system of record)   |      | Redis            |
            | users, deals, proofs, credits,  |      | rate limits,     |
            | entitlements, audit events      |      | locks, cache     |
            +----------------+----------------+      +------------------+
                                             |
                                             v
                                +------+-------+
                                | Object Store |
                                | receipt files|
                                +--------------+
```

### 22.2. Payment Proof to Entitlement Sequence

```text
Client          API/BFF        Verification Svc      Entitlement Svc      Connector
    |                |                 |                    |                 |
    | POST proof     |                 |                    |                 |
    |--------------->|                 |                    |                 |
    |                | persist proof   |                    |                 |
    |                |---------------> |                    |                 |
    |                | status=submitted|                    |                 |
    |<---------------|                 |                    |                 |
    |                |                 | reviewer verifies  |                 |
    |                |                 |------------------->| issue token     |
    |                |                 |                    |---------------->|
    |                |                 |                    | entitlement     |
    |                | status=verified |                    |                 |
    |<---------------|                 |                    |                 |
    |                                                                 activate|
```

### 22.3. Connector Runtime Decision Flow

```text
Start protected call
                |
                v
Token exists and not near expiry?
    | yes                         | no
    v                             v
Check policy state         Refresh entitlement
    |                             |
    | active                      | success
    v                             v
Run protected op          Check policy state
    |                             |
    +-----------------------------+
    |
    | suspended/revoked or refresh fail
    v
Check offline lease valid?
    | yes                         | no
    v                             v
Allow limited mode         Deny + return reason
```

## 23. REFERENCE FOLDER TREE (MONOREPO)

```text
safecode/
    apps/
        api-gateway/
            src/
                main.ts
                modules/
                    auth/
                    routing/
                    middleware/
        verification-service/
            src/
                modules/
                    deals/
                    payment-proofs/
                    review/
        entitlement-service/
            src/
                modules/
                    issue/
                    refresh/
                    lease/
                    policy-guard/
        metering-service/
            src/
                modules/
                    credit-ledger/
                    usage-rating/
                    balances/
        notification-service/
            src/
                modules/
                    email/
                    templates/

    packages/
        connector-sdk-node/
            src/
                auth/
                entitlement/
                runtime/
                errors/
                index.ts
        shared-contracts/
            src/
                api-types/
                error-codes/
                events/
        shared-security/
            src/
                signing/
                nonce/
                token/

    web/
        dashboard/
            src/
                pages/
                features/
                    deals/
                    review/
                    policies/
                    credits/
                    audit/

    infra/
        docker/
        k8s/
        migrations/
        scripts/

    docs/
        architecture/
        api/
        runbooks/
        test-plans/

    tests/
        e2e/
        integration/
        load/
```

## 24. FUNCTION RESPONSIBILITY MAP

The function names below are reference names to clarify what each module must implement.

### 24.1. API Gateway / BFF

- `authenticateRequest(req)`: validate bearer token/session.
- `authorizeRole(req, requiredRole)`: enforce RBAC.
- `attachRequestContext(req)`: inject `requestId`, tenant, actor metadata.
- `routeToService(req)`: forward request to downstream service.
- `mapServiceError(err)`: convert downstream errors to standard error shape.

### 24.2. Verification Service

- `createDeal(input)`: create deal + unique transfer reference.
- `submitPaymentProof(input)`: store proof and set `submitted` state.
- `verifyPaymentProof(input)`: transition to `verified` or `rejected`.
- `expireStaleDeals(now)`: move timed-out deals to `expired`.
- `recordVerificationAudit(event)`: emit immutable audit event.

### 24.3. Entitlement Service

- `issueEntitlement(input)`: create short-lived entitlement token.
- `refreshEntitlement(input)`: rotate token when policy/credits valid.
- `revokeEntitlement(input)`: force revoke active entitlement.
- `validateLease(input)`: determine if offline lease still allows limited ops.
- `getEntitlementStatus(dealId)`: return policy + entitlement + lease status.

### 24.4. Metering Service

- `computeCreditsUsed(opContext)`: apply rating formula.
- `debitCredits(tenantId, amount, context)`: append debit ledger event.
- `grantSignupCredits(tenantId)`: initialize free tier credits.
- `applyTopup(tenantId, amount)`: append top-up ledger event.
- `getBalance(tenantId)`: return current balance and thresholds.

### 24.5. Notification Service

- `sendActivationNotification(email, dealId)`: send verification-complete message.
- `sendLowBalanceAlert(email, balance)`: notify low credits.
- `sendPolicyChangeNotice(email, state)`: notify suspend/revoke transitions.

### 24.6. Connector SDK (Node)

- `initialize(config)`: configure tenant/project/environment context.
- `fetchEntitlement()`: obtain token from entitlement endpoint.
- `refreshIfNeeded()`: refresh token near expiry.
- `executeProtectedOperation(payload)`: call hosted protected workflow.
- `handleDeniedResponse(err)`: map policy/credit/lease errors to client app behavior.
- `canRunInOfflineLease(now)`: allow/deny limited mode while disconnected.

## 25. SERVICE RUNTIME CHECKLIST

Before marking MVP complete, each service must satisfy:

- Startup health check endpoint (`/healthz`).
- Structured logs with `requestId` and `tenantId`.
- Metrics endpoint (`/metrics`) for latency/error rates.
- Config validation on boot (fail fast on missing secrets).
- Migration compatibility check on deployment.
- Runbook entry in `docs/runbooks/`.

## 26. STARTER TASK BOARD (ISSUE-READY)

This section can be copied directly into GitHub Issues/Jira tickets.

### 26.1. Ticket Format

Use this template for all tickets:

- `Title`
- `Owner`
- `Priority` (`P0` | `P1` | `P2`)
- `Dependencies`
- `Scope`
- `Definition of Done`

### 26.2. Sprint 1 (Foundation)

**T1 - Bootstrap monorepo and shared contracts**

- Owner: QA/DevOps
- Priority: `P0`
- Dependencies: none
- Scope: Initialize folder tree from Section 23, lint/test configs, CI pipeline skeleton.
- Definition of Done: CI runs for all workspaces; commit hooks active; base README created.

**T2 - Implement auth context in API gateway**

- Owner: Entitlements/Auth
- Priority: `P0`
- Dependencies: `T1`
- Scope: `authenticateRequest`, `authorizeRole`, `attachRequestContext` from Section 24.1.
- Definition of Done: Protected endpoints reject unauthorized requests and return standard errors.

**T3 - Create core database schema and migrations**

- Owner: Backend Core
- Priority: `P0`
- Dependencies: `T1`
- Scope: Tables from Section 13 (`users` to `audit_events`) + migration tooling.
- Definition of Done: Fresh environment can migrate up/down cleanly.

### 26.3. Sprint 2 (Deal + Proof Flow)

**T4 - Build `POST /v1/deals`**

- Owner: Backend Core
- Priority: `P0`
- Dependencies: `T2`, `T3`
- Scope: Implement deal creation and unique transfer reference generation.
- Definition of Done: Endpoint returns `dealId`, `transferReference`, and audit event.

**T5 - Build `POST /v1/payments/proof` with file metadata validation**

- Owner: Backend Core
- Priority: `P0`
- Dependencies: `T3`, `T4`
- Scope: Proof submission, state transition to `submitted`, receipt URL persistence.
- Definition of Done: Invalid payloads rejected; success path updates state and audit log.

**T6 - Dashboard pages for deal creation and proof submission status**

- Owner: Dashboard Frontend
- Priority: `P1`
- Dependencies: `T4`, `T5`
- Scope: Deal form, proof status table, transfer reference display.
- Definition of Done: End-to-end UI flow works against staging API.

### 26.4. Sprint 3 (Verification + Entitlement)

**T7 - Build `POST /v1/payments/verify` reviewer workflow**

- Owner: Verification Workstream
- Priority: `P0`
- Dependencies: `T5`
- Scope: Reviewer decision endpoint with `verified`/`rejected` transitions and reason codes.
- Definition of Done: Only reviewer/admin role can verify; transitions follow Section 14.1 guards.

**T8 - Build entitlement issuance and status endpoints**

- Owner: Entitlements/Auth
- Priority: `P0`
- Dependencies: `T7`
- Scope: `POST /v1/entitlements/issue`, `GET /v1/entitlements/status`.
- Definition of Done: Tokens issued only after verified payment; status reflects policy/lease.

**T9 - Connector SDK activation path**

- Owner: Connector SDK
- Priority: `P1`
- Dependencies: `T8`
- Scope: `initialize`, `fetchEntitlement`, `executeProtectedOperation`.
- Definition of Done: Demo app can activate protected operation using issued entitlement.

### 26.5. Sprint 4 (Credits + Reliability)

**T10 - Implement credit ledger and deduction logic**

- Owner: Metering/Billing
- Priority: `P0`
- Dependencies: `T3`, `T8`
- Scope: `computeCreditsUsed`, `debitCredits`, `getBalance`, `INSUFFICIENT_CREDITS` behavior.
- Definition of Done: Protected operation debits credits and blocks when insufficient.

**T11 - Implement offline lease and refresh behavior**

- Owner: Entitlements/Auth + Connector SDK
- Priority: `P1`
- Dependencies: `T8`, `T9`
- Scope: `refreshIfNeeded`, `validateLease`, lease expiry deny behavior.
- Definition of Done: Integration tests prove continue-within-lease and deny-after-expiry.

**T12 - Notification workflows (activation + low balance)**

- Owner: Notification Service
- Priority: `P2`
- Dependencies: `T8`, `T10`
- Scope: Activation email, low-balance alerts; email as notification-only channel.
- Definition of Done: Triggered notifications sent with request-linked audit events.

### 26.6. Sprint 5 (Hardening + Demo)

**T13 - Add idempotency and rate limiting across critical endpoints**

- Owner: Backend Core + QA/DevOps
- Priority: `P1`
- Dependencies: `T4`, `T5`, `T8`
- Scope: `Idempotency-Key` behavior and per-tenant rate limits.
- Definition of Done: Duplicate request tests and `429` behavior pass.

**T14 - Build observability pack (logs, metrics, runbooks)**

- Owner: QA/DevOps
- Priority: `P1`
- Dependencies: `T1`
- Scope: `/healthz`, `/metrics`, structured logs, runbooks for each service.
- Definition of Done: Service runtime checklist in Section 25 fully satisfied.

**T15 - Final end-to-end demo script and test evidence**

- Owner: All workstreams (led by QA/DevOps)
- Priority: `P0`
- Dependencies: `T1`-`T14`
- Scope: Scripted demo matching Section 10.4 acceptance criteria + KPI snapshots.
- Definition of Done: Demo can be replayed on staging in under 10 minutes.

### 26.7. Backlog Rules

- No new feature tickets after Sprint 3 without project lead approval.
- Bug/security tickets can preempt `P2` tasks.
- Every merged ticket must link at least one test case.

## 27. IMPLEMENTATION DECISIONS (LOCKED FOR MVP)

This section resolves the remaining ambiguity so the team can implement without blocking decisions.

### 27.1. Entitlement Token Format and Claims

**Final MVP choice:** JWT with `EdDSA` signature.

- Access entitlement TTL: `15 minutes`.
- Refresh allowed only when policy state is not `revoked` and credits are sufficient.
- Signing keys are rotated; `kid` header is required.

Required JWT header:

- `alg`: `EdDSA`
- `typ`: `JWT`
- `kid`: active signing key id

Required JWT claims:

- `iss`: `safecode-entitlement-service`
- `aud`: `safecode-connector`
- `sub`: client tenant id
- `jti`: unique token id
- `iat`, `nbf`, `exp`
- `tenant_id`
- `project_id`
- `deal_id`
- `env` (`dev` | `staging` | `prod`)
- `scope` (for MVP: `execute:protected`)
- `policy_state` (`active` | `suspended` | `revoked`)
- `lease_until` (nullable unix timestamp)

Validation rules:

- Reject token if `exp` exceeded.
- Reject token if `policy_state` is `revoked`.
- Reject token if `env` does not match connector runtime configuration.
- Reject token if `jti` is on revocation list.

### 27.2. Credit Formula Constants

Use the following deterministic formula for MVP:

`credits_used = base_cost + size_factor + complexity_factor + environment_factor`

Constants:

- `base_cost = 1`

Size factors:

- `S` (<= 500 KB): `0`
- `M` (501 KB - 2 MB): `1`
- `L` (2 MB - 10 MB): `3`
- `XL` (> 10 MB): `6`

Complexity factors:

- `validate` endpoint: `0`
- `execute` endpoint: `2`
- `batch_execute` endpoint: `5`

Environment factors:

- `dev`: `0`
- `staging`: `1`
- `prod`: `2`

Examples:

- `S + validate + dev` => `1 + 0 + 0 + 0 = 1`
- `L + execute + prod` => `1 + 3 + 2 + 2 = 8`
- `XL + batch_execute + prod` => `1 + 6 + 5 + 2 = 14`

Starter balance defaults:

- Free tier monthly grant: `300` credits
- Starter tier monthly grant: `2,000` credits
- Pro tier monthly grant: `10,000` credits

### 27.3. Receipt File Upload Constraints

Allowed file types:

- `image/jpeg`
- `image/png`
- `application/pdf`

File constraints:

- Max file size: `8 MB`
- Max files per proof submission: `1`
- File name normalized and random object key assigned server-side

Security constraints:

- MIME and extension must both match allowed list.
- Reject password-protected PDFs in MVP.
- Run malware scan before marking proof as `submitted`.

Retention policy:

- Raw receipt files retained for `12 months`.
- After deletion, keep metadata + file hash for audit for `24 months`.

### 27.4. Proof Re-submission and Conflict Policy

Rules per `deal_id`:

- Maximum attempts: `3` proof submissions before manual admin escalation.
- If deal is `pending` or `rejected`, new proof may be submitted.
- If deal is `submitted`, new proof replaces prior submission and prior proof is marked `superseded`.
- If deal is `verified`, further proof uploads are rejected with `DEAL_ALREADY_VERIFIED`.
- If deal is `expired`, uploads are rejected with `PROOF_EXPIRED` unless reviewer reopens deal.

Late proof policy:

- Reopen window: up to `7 days` after `expired`.
- Reopen requires reviewer/admin role and reason code `REOPEN_APPROVED`.

Concurrency policy:

- Verification decision uses optimistic lock on proof version.
- If stale version is used, return `409 PROOF_VERSION_CONFLICT`.

### 27.5. Environment Configuration Matrix

| Config Item | dev | staging | prod |
| --- | --- | --- | --- |
| Token TTL | 60 min | 30 min | 15 min |
| Offline Lease Window | 72 h | 48 h | 24 h |
| Rate Limit (req/min/tenant) | 600 | 300 | 120 |
| Audit Log Level | debug | info | info |
| PII Log Redaction | optional | required | required |
| Notification Email Provider | sandbox | test domain | production domain |
| File Storage Bucket | `safecode-dev-receipts` | `safecode-staging-receipts` | `safecode-prod-receipts` |
| Allowed CORS Origins | localhost + dev UI | staging UI only | production UI only |
| DB Backups | daily | every 12h | every 6h |
| Alerting | basic | standard | strict/on-call |

Change control:

- Any prod config change requires reviewer/admin approval and audit event.
- Secrets are environment-scoped and never reused across `dev`, `staging`, and `prod`.