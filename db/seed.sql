-- ZK-Procure Seed Data
-- Architecture Specification Section 14

-- 1. Insert Organizations
INSERT INTO organizations (id, legal_name, org_type, gstin, canonical_company_id, razorpay_linked_account_id)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Corp', 'BUYER', '07AABCA1234A1Z5', 'CIN-ACME-001', NULL),
  ('22222222-2222-2222-2222-222222222222', 'ABC Industrial Pvt Ltd', 'SUPPLIER', '29AABCI1234A1Z5', 'CIN-ABCI-001', 'acc_ABCIndustrialRoute01'),
  ('33333333-3333-3333-3333-333333333333', 'Delta Traders', 'SUPPLIER', '06AABCD1234A1Z5', 'CIN-DELT-002', 'acc_DeltaTradersRoute02'),
  ('44444444-4444-4444-4444-444444444444', 'EdgeCase Metals', 'SUPPLIER', '27AABCE1234A1Z5', 'CIN-EDGC-003', NULL)
ON CONFLICT (canonical_company_id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  gstin = EXCLUDED.gstin,
  org_type = EXCLUDED.org_type;

-- 2. Insert Users (password: 'demo123')
INSERT INTO users (id, organization_id, email, role, password_hash)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'buyer_admin@acme.com', 'BUYER_ADMIN', '$2b$10$rQEY0tVQzUG7VHQfPGJMUOIYvDCGbPwMVQTB3fQh7JHPwxPQHzJXm'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'admin@abcindustrial.com', 'SUPPLIER_ADMIN', '$2b$10$rQEY0tVQzUG7VHQfPGJMUOIYvDCGbPwMVQTB3fQh7JHPwxPQHzJXm'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'admin@deltatraders.com', 'SUPPLIER_ADMIN', '$2b$10$rQEY0tVQzUG7VHQfPGJMUOIYvDCGbPwMVQTB3fQh7JHPwxPQHzJXm'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'admin@edgecase.com', 'SUPPLIER_ADMIN', '$2b$10$rQEY0tVQzUG7VHQfPGJMUOIYvDCGbPwMVQTB3fQh7JHPwxPQHzJXm')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  password_hash = EXCLUDED.password_hash;

-- 3. Insert Mock FIP Credential Issuer
INSERT INTO credential_issuers (id, name, public_key, trust_level)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Mock FIP - Demo Environment', '0x2a3e9c5f87b1049216de45f8a02c91b7e436d91823751a029384756102938475', 'SYNTHETIC_DEMO')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public_key = EXCLUDED.public_key,
  trust_level = EXCLUDED.trust_level;

-- 4. Insert Identity Commitments for Suppliers
INSERT INTO identity_commitments (id, organization_id, commitment, salt_hash)
VALUES
  ('20000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', '0x1a8f9c2d3e4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0', '0x99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff'),
  ('30000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', '0x2b9f0d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1', '0x887766554433221100aabbccddeeff99887766554433221100aabbccddeeff00'),
  ('40000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', '0x3c0f1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', '0x7766554433221100aabbccddeeff99887766554433221100aabbccddeeff0011')
ON CONFLICT (organization_id, commitment) DO NOTHING;

-- 5. Insert Policy Templates (Policies + Policy Versions + Policy Hashes)

-- Enterprise Tier A (₹5Cr Working Capital, Valid GST, 900s freshness)
INSERT INTO policies (id, name, created_by)
VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Enterprise Tier A', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO policy_versions (id, policy_id, version_number, canonical_json, rego_module)
VALUES
  (
    'f1111111-1111-1111-1111-111111111112',
    'f1111111-1111-1111-1111-111111111111',
    1,
    '{"maxCredentialAgeSeconds":900,"policyName":"Enterprise Tier A","requiredGstValid":true,"requiredThresholdPaise":50000000}'::jsonb,
    'package zkprocure.tier_a\n\ndefault allow = false\n\nallow {\n    input.working_capital_paise >= 50000000\n    input.gst_valid == true\n    input.credential_age_seconds <= 900\n}'
  )
ON CONFLICT (policy_id, version_number) DO UPDATE SET
  canonical_json = EXCLUDED.canonical_json,
  rego_module = EXCLUDED.rego_module;

INSERT INTO policy_hashes (id, policy_version_id, sha256_hash, poseidon_hash)
VALUES
  (
    'f1111111-1111-1111-1111-111111111113',
    'f1111111-1111-1111-1111-111111111112',
    'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    '0x2059385920394857209384752093847502938475029384750293847502938475'
  )
ON CONFLICT (policy_version_id) DO UPDATE SET
  sha256_hash = EXCLUDED.sha256_hash,
  poseidon_hash = EXCLUDED.poseidon_hash;

-- Enterprise Tier B (₹3Cr Working Capital, Valid GST, 900s freshness)
INSERT INTO policies (id, name, created_by)
VALUES
  ('f2222222-2222-2222-2222-222222222221', 'Enterprise Tier B', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO policy_versions (id, policy_id, version_number, canonical_json, rego_module)
VALUES
  (
    'f2222222-2222-2222-2222-222222222222',
    'f2222222-2222-2222-2222-222222222221',
    1,
    '{"maxCredentialAgeSeconds":900,"policyName":"Enterprise Tier B","requiredGstValid":true,"requiredThresholdPaise":30000000}'::jsonb,
    'package zkprocure.tier_b\n\ndefault allow = false\n\nallow {\n    input.working_capital_paise >= 30000000\n    input.gst_valid == true\n    input.credential_age_seconds <= 900\n}'
  )
ON CONFLICT (policy_id, version_number) DO UPDATE SET
  canonical_json = EXCLUDED.canonical_json,
  rego_module = EXCLUDED.rego_module;

INSERT INTO policy_hashes (id, policy_version_id, sha256_hash, poseidon_hash)
VALUES
  (
    'f2222222-2222-2222-2222-222222222223',
    'f2222222-2222-2222-2222-222222222222',
    'b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01a',
    '0x1059385920394857209384752093847502938475029384750293847502938475'
  )
ON CONFLICT (policy_version_id) DO UPDATE SET
  sha256_hash = EXCLUDED.sha256_hash,
  poseidon_hash = EXCLUDED.poseidon_hash;

-- 6. Insert Initial Demo Credentials for Suppliers
INSERT INTO credentials (id, supplier_org_id, issuer_id, credential_commitment, issued_at, issuer_signature, revoked_at)
VALUES
  -- ABC Industrial (Active, valid)
  ('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '0xabc111commitment222333444555666777888999aaabbbcccdddeeefff000111222', now(), '0xabc111sig222333444555666777888999aaabbbcccdddeeefff000111222333444555', NULL),
  -- Delta Traders (Active, valid)
  ('c2222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '0xdelt222commitment333444555666777888999aaabbbcccdddeeefff000111222333', now(), '0xdelt222sig333444555666777888999aaabbbcccdddeeefff000111222333444555666', NULL),
  -- EdgeCase Metals (Revoked credential for revocation testing)
  ('c3333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '0xedge333commitment444555666777888999aaabbbcccdddeeefff000111222333444', now() - INTERVAL '1 day', '0xedge333sig444555666777888999aaabbbcccdddeeefff000111222333444555666777', now() - INTERVAL '1 hour')
ON CONFLICT (id) DO UPDATE SET
  credential_commitment = EXCLUDED.credential_commitment,
  issuer_signature = EXCLUDED.issuer_signature,
  revoked_at = EXCLUDED.revoked_at;
