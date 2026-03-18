# SafeCode Constitution

## Core Principles

### I. Security-First by Default
- All authn/authz paths SHALL fail closed.
- JWT-based access control SHALL verify cryptographic signature and critical claims before trust.
- Secrets SHALL be environment-scoped and never hardcoded.

### II. Contract-Driven Interfaces
- Public service and package interfaces SHALL use explicit request/response contracts.
- Error responses SHALL use the standardized shape (`code`, `message`, `requestId`, `timestamp`).
- State transitions SHALL be deterministic and represented in code and tests.

### III. Verifiable Delivery
- Every merged task SHALL include automated validation at an appropriate level (unit/integration/e2e).
- CI SHALL run lint, test, and build for all workspaces.
- Changes without executable validation evidence SHALL NOT be marked complete.

### IV. Observability and Auditability
- Sensitive operations SHALL emit auditable events with actor and request context.
- Services SHALL provide health and metrics endpoints before release readiness.
- Logs SHALL include request correlation identifiers.

### V. Simplicity and Scope Discipline
- Implement the smallest change that satisfies current requirements.
- Avoid speculative abstractions and out-of-scope features.
- Prefer clear, maintainable code over clever solutions.

## Delivery Constraints

- Runtime baseline: Node.js 20+.
- Monorepo baseline: workspace-aware lint/test/build scripts.
- Data baseline: schema changes MUST be migration-backed and reversible in development.
- Security baseline: high-risk changes MUST include threat-aware review notes.

## Workflow and Quality Gates

- Use feature branches named `NNN-short-description` for spec workflows.
- Keep `spec/Requirements.md`, `spec/Design.md`, and `spec/Task.md` synchronized with implementation.
- A task can be checked complete only when code, validation, and requirement mapping are all aligned.

## Governance

- This constitution overrides conflicting local workflow preferences.
- Amendments require updating this file and documenting rationale in repository history.
- Compliance is verified during implementation reviews and spec analysis.

**Version**: 1.0.0 | **Ratified**: 2026-03-18 | **Last Amended**: 2026-03-18
