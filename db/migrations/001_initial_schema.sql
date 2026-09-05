-- ZK-Procure Initial Database Schema
-- Architecture Specification Section 6

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================= CORE IDENTITY =================
CREATE TYPE org_type AS ENUM ('BUYER', 'SUPPLIER', 'PLATFORM');

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name TEXT NOT NULL,
    org_type org_type NOT NULL,
    gstin TEXT,
    canonical_company_id TEXT UNIQUE NOT NULL, -- e.g. CIN or internal canonical ID
    razorpay_linked_account_id TEXT,           -- nullable, set once Route onboarding done
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('BUYER_ADMIN','SUPPLIER_ADMIN','PLATFORM_ADMIN')),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE identity_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    commitment TEXT NOT NULL,       -- Poseidon(company_id, gstin, salt) as hex
    salt_hash TEXT NOT NULL,        -- hash of salt, salt itself never stored server-side
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (organization_id, commitment)
);

-- ================= CREDENTIALS =================
CREATE TABLE credential_issuers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                -- 'Mock FIP - Demo Environment'
    public_key TEXT NOT NULL,          -- EdDSA pubkey, hex
    trust_level TEXT NOT NULL DEFAULT 'SYNTHETIC_DEMO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    issuer_id UUID NOT NULL REFERENCES credential_issuers(id) ON DELETE RESTRICT,
    credential_commitment TEXT NOT NULL,  -- Poseidon hash of private fields, stored, not raw value
    issued_at TIMESTAMPTZ NOT NULL,
    issuer_signature TEXT NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    -- NOTE: raw working_capital is NEVER stored in this table or anywhere server-side.
    -- It exists only transiently on the supplier's client during proof generation.
);

-- ================= POLICY =================
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,               -- 'Enterprise Tier A'
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    canonical_json JSONB NOT NULL,     -- exact bytes hashed below
    rego_module TEXT NOT NULL,         -- compiled OPA policy for this version
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (policy_id, version_number)
);

CREATE TABLE policy_hashes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_version_id UUID NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE UNIQUE,
    sha256_hash TEXT NOT NULL UNIQUE,
    poseidon_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================= TRANSACTIONS / STATE MACHINE =================
CREATE TYPE txn_state AS ENUM (
    'DRAFT','POLICY_CREATED','SUPPLIER_SELECTED','AWAITING_CREDENTIAL',
    'PROOF_GENERATING','VERIFYING','AUTHORIZED','PAYMENT_PENDING',
    'PAYMENT_SUCCESS','SETTLED',
    'PROOF_INVALID','CREDENTIAL_EXPIRED','IDENTITY_MISMATCH','POLICY_FAILED',
    'PAYMENT_FAILED','PAYMENT_TIMEOUT','DISPUTED','CANCELLED'
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    supplier_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    policy_version_id UUID REFERENCES policy_versions(id) ON DELETE SET NULL,
    amount_paise BIGINT NOT NULL,
    state txn_state NOT NULL DEFAULT 'DRAFT',
    order_nonce TEXT NOT NULL UNIQUE,          -- generated at DRAFT, bound into every proof request
    authorized_at TIMESTAMPTZ,
    authorization_token TEXT,                  -- internal signed token, scoped, short TTL
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_transactions_state ON transactions(state);

CREATE TABLE transaction_transitions (      -- append-only audit of the state machine itself
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    from_state txn_state,
    to_state txn_state NOT NULL,
    caused_by TEXT NOT NULL,                -- 'agent_request', 'zk_verifier', 'webhook', 'system_timeout', 'human_action'
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================= PROOFS =================
CREATE TABLE proof_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    credential_id UUID NOT NULL REFERENCES credentials(id) ON DELETE RESTRICT,
    policy_hash TEXT NOT NULL REFERENCES policy_hashes(sha256_hash) ON DELETE RESTRICT,
    order_nonce TEXT NOT NULL,
    supplier_identity_commitment TEXT NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proof_request_id UUID NOT NULL REFERENCES proof_requests(id) ON DELETE CASCADE,
    nonce TEXT NOT NULL UNIQUE,             -- == order_nonce, enforced single-use here
    nonce_consumed_at TIMESTAMPTZ,
    proof_json JSONB NOT NULL,              -- groth16 proof {pi_a, pi_b, pi_c}
    public_signals JSONB NOT NULL,          -- [policy_hash, order_nonce, identity_commitment, cred_timestamp]
    verification_result BOOLEAN,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================= PAYMENTS =================
CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,               -- derived from transaction_id + action + attempt
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    action TEXT NOT NULL,                   -- 'create_order' | 'capture' | 'transfer'
    response_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE UNIQUE,
    razorpay_order_id TEXT UNIQUE,
    receipt TEXT NOT NULL UNIQUE,
    amount_paise BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'created',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    status TEXT NOT NULL,                  -- created/authorized/captured/failed/refunded
    captured_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razorpay_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    signature_valid BOOLEAN NOT NULL,
    raw_payload JSONB NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================= AGENT =================
CREATE TABLE agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    initiated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_message TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ
);

CREATE TABLE agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    tool_input JSONB NOT NULL,
    tool_output JSONB,
    allowed BOOLEAN NOT NULL,               -- false if blocked by allowlist/authz layer
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================= AUDIT =================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type TEXT NOT NULL,               -- 'agent' | 'system' | 'human' | 'webhook'
    actor_id TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    detail JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
