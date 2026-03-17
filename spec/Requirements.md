# SafeCode Requirements

Source of truth: `PROJECT_PROPOSAL.md`

ID convention:
- `REQ-SCP-*`: scope
- `REQ-FN-*`: functional
- `REQ-SEC-*`: security
- `REQ-DATA-*`: data model
- `REQ-FILE-*`: file upload and retention
- `REQ-CONF-*`: proof conflict and re-submission
- `REQ-ENV-*`: environment controls
- `REQ-QLT-*`: quality and success criteria

## 1. Product Scope

- [REQ-SCP-001] SafeCode is an IP protection and license enforcement platform for freelance engineers.

Primary strategy:
- [REQ-SCP-002] Keep sensitive logic server-side (hosted core engine).
- [REQ-SCP-003] Ship a thin Node connector/SDK to clients.
- [REQ-SCP-004] Enforce access with short-lived signed entitlements and policy checks.

Out of scope for MVP:
- [REQ-SCP-005] Payment processing/custody is out of scope.
- [REQ-SCP-006] Unbreakable protection claims on client-owned machines are out of scope.
- [REQ-SCP-007] Global bank verification automation is out of scope.
- [REQ-SCP-008] Non-Node runtime support is out of scope.
- [REQ-SCP-009] Anti-debug crash logic, wasm hardening, custom packer/loader runtime, and AI legal/email modules are out of scope.

## 2. Functional Requirements

### 2.1 Licensing and Policy
- [REQ-FN-001] Issue short-lived entitlements for verified deals.
- [REQ-FN-002] Support policy states: `active`, `suspended`, `revoked`.
- [REQ-FN-003] Support soft revoke (block new sessions) and hard revoke behavior after grace window.
- [REQ-FN-004] Provide entitlement status endpoint for connector and dashboard.

### 2.2 Non-Custodial Payment Verification
- [REQ-FN-005] Create deals with unique transfer references.
- [REQ-FN-006] Client can submit payment proof (receipt + metadata).
- [REQ-FN-007] Reviewer can verify or reject proof.
- [REQ-FN-008] Entitlement is issued automatically only after `verified`.
- [REQ-FN-009] Keep immutable audit trail for all verification decisions.

Verification states:
- [REQ-FN-010] Verification state model must include `pending`, `submitted`, `verified`, `rejected`, `expired`.

### 2.3 Connector Runtime
- [REQ-FN-011] Connector must authenticate, fetch entitlements, refresh near expiry, and execute protected operations via hosted APIs.
- [REQ-FN-012] Connector must support offline lease behavior with controlled deny after lease expiry.
- [REQ-FN-013] Connector must never require long-lived raw license keys from email.

### 2.4 Credit Monetization
- [REQ-FN-014] Support free starter credits and paid top-up/plan upgrades.
- [REQ-FN-015] Deduct credits per protected operation using weighted formula.
- [REQ-FN-016] Insufficient balance must deny operation with `INSUFFICIENT_CREDITS`.
- [REQ-FN-017] Provide usage transparency via dashboard and export.

### 2.5 APIs (MVP)
Required endpoints:
- [REQ-FN-018] `POST /v1/deals`
- [REQ-FN-019] `POST /v1/payments/proof`
- [REQ-FN-020] `POST /v1/payments/verify`
- [REQ-FN-021] `POST /v1/entitlements/issue`
- [REQ-FN-022] `GET /v1/entitlements/status?dealId=...`

### 2.6 Operational Requirements
- [REQ-FN-023] Enforce idempotency on critical POST endpoints.
- [REQ-FN-024] Enforce per-tenant rate limits.
- [REQ-FN-025] Use standardized error schema with `code`, `message`, `requestId`, `timestamp`.
- [REQ-FN-026] Provide health and metrics endpoints per service.

## 3. Security Requirements

- [REQ-SEC-001] Enforce TLS for all service traffic.
- [REQ-SEC-002] Sign JWT entitlements with `EdDSA`.
- [REQ-SEC-003] Include required JWT claims and header fields per locked MVP decisions.
- [REQ-SEC-004] Enforce replay protection via nonce/timestamp validation.
- [REQ-SEC-005] Enforce least-privilege RBAC for users and services.
- [REQ-SEC-006] Manage secrets via Vault/KMS.
- [REQ-SEC-007] Validate receipt uploads and run malware scanning.
- [REQ-SEC-008] Maintain immutable audit logging for sensitive actions.

## 4. Data Requirements (MVP)

Required entities/tables:
- [REQ-DATA-001] `users`
- [REQ-DATA-002] `tenants`
- [REQ-DATA-003] `projects`
- [REQ-DATA-004] `deals`
- [REQ-DATA-005] `payment_proofs`
- [REQ-DATA-006] `entitlements`
- [REQ-DATA-007] `credit_ledgers`
- [REQ-DATA-008] `audit_events`

## 5. File Upload and Retention Requirements

Accepted proof file types:
- [REQ-FILE-001] Accept proof file types: `image/jpeg`, `image/png`, `application/pdf`.

Constraints:
- [REQ-FILE-002] Max proof file size is `8 MB`.
- [REQ-FILE-003] Max files per submission is `1`.
- [REQ-FILE-004] Reject password-protected PDF files in MVP.

Retention:
- [REQ-FILE-005] Retain raw files for 12 months.
- [REQ-FILE-006] Retain metadata and file hash for 24 months after deletion.

## 6. Conflict and Re-Submission Requirements

Per `deal_id`:
- [REQ-CONF-001] Limit proof attempts to 3 before admin escalation.
- [REQ-CONF-002] Allow proof submission when deal state is `pending` or `rejected`.
- [REQ-CONF-003] In `submitted`, new proof replaces prior proof and prior proof is marked `superseded`.
- [REQ-CONF-004] In `verified`, reject new upload with `DEAL_ALREADY_VERIFIED`.
- [REQ-CONF-005] In `expired`, reject upload with `PROOF_EXPIRED` unless reopened by reviewer/admin.
- [REQ-CONF-006] Allow reopen window up to 7 days with `REOPEN_APPROVED` reason code.
- [REQ-CONF-007] Verification must use optimistic locking; stale updates return `409 PROOF_VERSION_CONFLICT`.

## 7. Environment Requirements

Configuration differences must exist for `dev`, `staging`, `prod` including:
- [REQ-ENV-001] Configure different token TTL values per environment.
- [REQ-ENV-002] Configure different offline lease windows per environment.
- [REQ-ENV-003] Configure different rate limits per environment.
- [REQ-ENV-004] Configure environment-specific log level and PII redaction behavior.
- [REQ-ENV-005] Configure environment-specific email provider mode.
- [REQ-ENV-006] Configure environment-specific storage buckets.
- [REQ-ENV-007] Configure environment-specific CORS policy.
- [REQ-ENV-008] Configure environment-specific backup cadence.
- [REQ-ENV-009] Configure environment-specific alerting strictness.

Production change control:
- [REQ-ENV-010] Require reviewer/admin approval and audit event for production config changes.
- [REQ-ENV-011] Prohibit cross-environment secret reuse.

## 8. Quality and Success Criteria

MVP policy targets:
- [REQ-QLT-001] Activation from verified proof must be under 5 minutes.
- [REQ-QLT-002] Offline lease default is 24h and configurable up to 72h.

Key KPIs:
- [REQ-QLT-003] Track activation success rate.
- [REQ-QLT-004] Track median verification-to-activation time.
- [REQ-QLT-005] Track false acceptance and false rejection rates.
- [REQ-QLT-006] Track outage resilience rate.

Demo acceptance criteria:
- [REQ-QLT-007] Demo must show deal creation.
- [REQ-QLT-008] Demo must show proof submission and verification.
- [REQ-QLT-009] Demo must show automatic entitlement issuance and connector activation.
- [REQ-QLT-010] Demo must show policy suspension and controlled deny behavior.
- [REQ-QLT-011] Demo must show full audit trace visibility.
