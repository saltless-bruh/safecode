BEGIN;

CREATE TYPE user_role AS ENUM ('freelancer_owner', 'reviewer_admin', 'client_admin', 'auditor');
CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE size_bucket AS ENUM ('S', 'M', 'L', 'XL');
CREATE TYPE deal_status AS ENUM ('pending', 'submitted', 'verified', 'rejected', 'expired');
CREATE TYPE review_status AS ENUM ('submitted', 'verified', 'rejected', 'superseded');
CREATE TYPE deployment_env AS ENUM ('dev', 'staging', 'prod');
CREATE TYPE entitlement_state AS ENUM ('issued', 'expired', 'revoked');
CREATE TYPE ledger_event_type AS ENUM ('grant', 'debit', 'topup', 'adjustment');

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES users(id),
  plan_tier plan_tier NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  size_bucket size_bucket NOT NULL,
  size_kb_snapshot INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deals (
  id UUID PRIMARY KEY,
  freelancer_tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  amount NUMERIC(12, 2) NOT NULL,
  currency CHAR(3) NOT NULL,
  transfer_reference TEXT NOT NULL UNIQUE,
  status deal_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_proofs (
  id UUID PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES deals(id),
  receipt_file_url TEXT NOT NULL,
  submitted_amount NUMERIC(12, 2) NOT NULL,
  submitted_transfer_time TIMESTAMPTZ NOT NULL,
  submitted_reference TEXT NOT NULL,
  submitted_by_user_id UUID NOT NULL REFERENCES users(id),
  review_status review_status NOT NULL,
  review_reason_code TEXT,
  reviewed_by_user_id UUID REFERENCES users(id),
  proof_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE entitlements (
  id UUID PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES deals(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  environment deployment_env NOT NULL,
  token_jti TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  state entitlement_state NOT NULL
);

CREATE TABLE credit_ledgers (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  project_id UUID REFERENCES projects(id),
  event_type ledger_event_type NOT NULL,
  credits_delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  usage_context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  actor_user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB NOT NULL,
  request_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_deals_project_id ON deals(project_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_payment_proofs_deal_id ON payment_proofs(deal_id);
CREATE INDEX idx_payment_proofs_review_status ON payment_proofs(review_status);
CREATE INDEX idx_entitlements_deal_id ON entitlements(deal_id);
CREATE INDEX idx_entitlements_tenant_id ON entitlements(tenant_id);
CREATE INDEX idx_credit_ledgers_tenant_id ON credit_ledgers(tenant_id);
CREATE INDEX idx_audit_events_tenant_id ON audit_events(tenant_id);
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at);

COMMIT;