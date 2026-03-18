# SafeCode Task Plan

Source of truth: `PROJECT_PROPOSAL.md`

This file mirrors the proposal's execution intent and is organized as implementation tasks.

## 1. Sprint Plan

### Sprint 1 - Foundation

- [x] T1 Bootstrap monorepo structure and shared contracts.
  - Owner: QA/DevOps
  - Dependencies: none
  - Requirements: REQ-ENG-001, REQ-ENG-002, REQ-ENG-003, REQ-ENG-004
  - Done when: CI runs all workspaces; base docs and hooks exist.

- [x] T2 Implement API Gateway auth context.
  - Owner: Entitlements/Auth
  - Dependencies: T1
  - Requirements: REQ-SEC-005, REQ-FN-025
  - Scope: `authenticateRequest`, `authorizeRole`, `attachRequestContext`

- [x] T3 Create core schema and migrations.
  - Owner: Backend Core
  - Dependencies: T1
  - Requirements: REQ-DATA-001, REQ-DATA-002, REQ-DATA-003, REQ-DATA-004, REQ-DATA-005, REQ-DATA-006, REQ-DATA-007, REQ-DATA-008
  - Scope: tables in Section 13 of proposal.

### Sprint 2 - Deal and Proof Flow

- [ ] T4 Build `POST /v1/deals`.
  - Owner: Backend Core
  - Dependencies: T2, T3
  - Requirements: REQ-FN-005, REQ-FN-018, REQ-FN-025
  - Output: deal + unique transfer reference + audit event.

- [ ] T5 Build `POST /v1/payments/proof` with upload metadata validation.
  - Owner: Backend Core
  - Dependencies: T3, T4
  - Requirements: REQ-FN-006, REQ-FN-010, REQ-FN-019, REQ-FILE-001, REQ-FILE-002, REQ-FILE-003, REQ-FILE-004, REQ-SEC-007
  - Output: state transition to `submitted`.

- [ ] T6 Build dashboard pages for deal creation and proof status.
  - Owner: Dashboard Frontend
  - Dependencies: T4, T5
  - Requirements: REQ-FN-017, REQ-FN-022, REQ-QLT-007, REQ-QLT-008

### Sprint 3 - Verification and Entitlement

- [ ] T7 Build `POST /v1/payments/verify` reviewer flow.
  - Owner: Verification Workstream
  - Dependencies: T5
  - Requirements: REQ-FN-007, REQ-FN-008, REQ-FN-009, REQ-FN-020, REQ-CONF-001, REQ-CONF-002, REQ-CONF-003, REQ-CONF-004, REQ-CONF-005, REQ-CONF-006, REQ-CONF-007
  - Must enforce state guards and role restrictions.

- [ ] T8 Build entitlement issue/status endpoints.
  - Owner: Entitlements/Auth
  - Dependencies: T7
  - Requirements: REQ-FN-001, REQ-FN-002, REQ-FN-003, REQ-FN-004, REQ-FN-021, REQ-FN-022, REQ-SEC-002, REQ-SEC-003
  - Scope: `POST /v1/entitlements/issue`, `GET /v1/entitlements/status`

- [ ] T9 Build connector activation path.
  - Owner: Connector SDK
  - Dependencies: T8
  - Requirements: REQ-FN-011, REQ-FN-013, REQ-QLT-009
  - Scope: `initialize`, `fetchEntitlement`, `executeProtectedOperation`

### Sprint 4 - Credits and Reliability

- [ ] T10 Implement credit ledger and deduction logic.
  - Owner: Metering/Billing
  - Dependencies: T3, T8
  - Requirements: REQ-FN-014, REQ-FN-015, REQ-FN-016, REQ-DATA-007, REQ-QLT-003, REQ-QLT-004, REQ-QLT-005, REQ-QLT-006
  - Must enforce formula constants and `INSUFFICIENT_CREDITS`.

- [ ] T11 Implement refresh and offline lease flow.
  - Owner: Entitlements/Auth + Connector SDK
  - Dependencies: T8, T9
  - Requirements: REQ-FN-012, REQ-ENV-001, REQ-ENV-002, REQ-QLT-002
  - Must support continue-within-lease and deny-after-expiry.

- [ ] T12 Implement notifications.
  - Owner: Notification Service
  - Dependencies: T8, T10
  - Requirements: REQ-FN-013, REQ-ENV-005
  - Scope: activation, low-balance, policy-change notifications.

### Sprint 5 - Hardening and Demo

- [ ] T13 Add idempotency and rate limiting on critical endpoints.
  - Owner: Backend Core + QA/DevOps
  - Dependencies: T4, T5, T8
  - Requirements: REQ-FN-023, REQ-FN-024, REQ-ENV-003

- [ ] T14 Implement observability pack.
  - Owner: QA/DevOps
  - Dependencies: T1
  - Requirements: REQ-FN-026, REQ-SEC-008, REQ-ENV-004, REQ-ENV-009
  - Scope: `/healthz`, `/metrics`, logs, runbooks.

- [ ] T15 Execute end-to-end demo and evidence capture.
  - Owner: All teams (QA/DevOps lead)
  - Dependencies: T1-T14
  - Requirements: REQ-QLT-007, REQ-QLT-008, REQ-QLT-009, REQ-QLT-010, REQ-QLT-011

## 2. Locked Decision Implementation Tasks

- [ ] D1 Implement JWT entitlement schema (`EdDSA`) with required headers/claims.
  - Requirements: REQ-SEC-002, REQ-SEC-003
- [ ] D2 Implement token validation rules (expiry, env match, revoked policy, revoked `jti`).
  - Requirements: REQ-FN-002, REQ-SEC-004, REQ-ENV-001
- [ ] D3 Implement credit formula constants and tier grants as locked in proposal.
  - Requirements: REQ-FN-014, REQ-FN-015, REQ-QLT-003
- [ ] D4 Implement file upload constraints (types, size, malware scanning, retention).
  - Requirements: REQ-FILE-001, REQ-FILE-002, REQ-FILE-003, REQ-FILE-004, REQ-FILE-005, REQ-FILE-006, REQ-SEC-007
- [ ] D5 Implement proof conflict policy (max attempts, superseded submissions, reopen, optimistic locking).
  - Requirements: REQ-CONF-001, REQ-CONF-002, REQ-CONF-003, REQ-CONF-004, REQ-CONF-005, REQ-CONF-006, REQ-CONF-007
- [ ] D6 Apply environment matrix differences in runtime configuration.
  - Requirements: REQ-ENV-001, REQ-ENV-002, REQ-ENV-003, REQ-ENV-004, REQ-ENV-005, REQ-ENV-006, REQ-ENV-007, REQ-ENV-008, REQ-ENV-009, REQ-ENV-010, REQ-ENV-011

## 3. Test Execution Tasks

- [ ] Q1 Unit tests for state transitions and policy guards.
  - Requirements: REQ-FN-010, REQ-FN-002, REQ-CONF-007
- [ ] Q2 Unit tests for credit formula and insufficient-credit behavior.
  - Requirements: REQ-FN-015, REQ-FN-016
- [ ] Q3 Integration tests for deal -> proof -> verify -> entitlement flow.
  - Requirements: REQ-FN-005, REQ-FN-006, REQ-FN-007, REQ-FN-008, REQ-FN-021
- [ ] Q4 Integration tests for idempotency and rate limits.
  - Requirements: REQ-FN-023, REQ-FN-024
- [ ] Q5 E2E tests for activation, suspension/revocation, and offline lease expiry.
  - Requirements: REQ-FN-003, REQ-FN-011, REQ-FN-012
- [ ] Q6 Abuse tests for replay attempts, reused receipts, and high-frequency entitlement requests.
  - Requirements: REQ-SEC-004, REQ-SEC-007, REQ-FN-024

## 4. Acceptance Checklist

- [ ] A1 Verified payment leads to entitlement issuance within target latency.
  - Requirements: REQ-QLT-001
- [ ] A2 Connector activates with valid entitlement and denies correctly on revoked/expired state.
  - Requirements: REQ-FN-011, REQ-FN-012, REQ-FN-002
- [ ] A3 Audit trail exists for all critical actions.
  - Requirements: REQ-SEC-008, REQ-FN-009
- [ ] A4 Credits are debited deterministically and visible in dashboard/export.
  - Requirements: REQ-FN-015, REQ-FN-017
- [ ] A5 Demo criteria in proposal Section 10.4 are fully reproducible in staging.
  - Requirements: REQ-QLT-007, REQ-QLT-008, REQ-QLT-009, REQ-QLT-010, REQ-QLT-011

## 5. Backlog Governance

- No new features after Sprint 3 without lead approval.
- Security/bug fixes can preempt P2 scope.
- Every merged task must include linked tests.
