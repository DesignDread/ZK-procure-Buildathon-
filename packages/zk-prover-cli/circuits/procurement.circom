pragma circom 2.1.6;

include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/eddsaposeidon.circom";
include "node_modules/circomlib/circuits/bitify.circom";

/*
 * ZK-Procure: Privacy-Preserving Procurement Compliance Circuit
 *
 * Proves that a supplier meets procurement requirements WITHOUT revealing
 * their actual financial values.
 *
 * Public inputs:
 *   - policyHash: hash of the compliance policy (binds proof to specific policy)
 *   - requiredThreshold: minimum working capital required (paise)
 *   - requiredGstValid: must be 1
 *   - maxCredentialAgeSeconds: maximum allowed credential age
 *   - orderNonce: unique per transaction (replay protection)
 *   - supplierIdentityCommitment: Poseidon(companyId, gstin, salt)
 *   - issuerPubkeyCommitment: Poseidon(pubkey_x, pubkey_y)
 *   - currentTimestamp: wall-clock time at proof generation
 *   - credentialTimestamp: when credential was issued
 *
 * Private inputs:
 *   - workingCapital: actual financial value (paise) - NEVER REVEALED
 *   - gstNumber: GST registration number
 *   - companyId: canonical company identifier
 *   - salt: random salt for identity commitment
 *   - issuerPubkeyX, issuerPubkeyY: EdDSA public key components
 *   - issuerSigR8x, issuerSigR8y: EdDSA signature R8 components
 *   - issuerSigS: EdDSA signature S component
 */

template ProcurementCompliance() {
    // ==================== PUBLIC INPUTS ====================
    signal input policyHash;
    signal input requiredThreshold;
    signal input requiredGstValid;
    signal input maxCredentialAgeSeconds;
    signal input orderNonce;
    signal input supplierIdentityCommitment;
    signal input issuerPubkeyCommitment;
    signal input currentTimestamp;
    signal input credentialTimestamp;

    // ==================== PRIVATE INPUTS ====================
    signal input workingCapital;
    signal input gstNumber;
    signal input companyId;
    signal input salt;
    signal input issuerPubkeyX;
    signal input issuerPubkeyY;
    signal input issuerSigR8x;
    signal input issuerSigR8y;
    signal input issuerSigS;

    // ==================== CONSTRAINT 1: Working Capital >= Required Threshold ====================
    // Uses 64-bit comparison to stay safely inside BN254 scalar field
    component geq = GreaterEqThan(64);
    geq.in[0] <== workingCapital;
    geq.in[1] <== requiredThreshold;
    geq.out === 1;

    // ==================== CONSTRAINT 2: GST Valid ====================
    // gstNumber must be non-zero (represents valid GST)
    signal gstIsNonZero;
    component gstCheck = IsZero();
    gstCheck.in <== gstNumber;
    gstIsNonZero <== 1 - gstCheck.out;
    gstIsNonZero === requiredGstValid;

    // ==================== CONSTRAINT 3: Credential Freshness ====================
    // currentTimestamp - credentialTimestamp <= maxCredentialAgeSeconds
    signal credentialAge;
    credentialAge <== currentTimestamp - credentialTimestamp;

    component freshness = LessEqThan(64);
    freshness.in[0] <== credentialAge;
    freshness.in[1] <== maxCredentialAgeSeconds;
    freshness.out === 1;

    // ==================== CONSTRAINT 4: Identity Commitment ====================
    // Poseidon(companyId, gstNumber, salt) === supplierIdentityCommitment
    component identityHash = Poseidon(3);
    identityHash.inputs[0] <== companyId;
    identityHash.inputs[1] <== gstNumber;
    identityHash.inputs[2] <== salt;
    identityHash.out === supplierIdentityCommitment;

    // ==================== CONSTRAINT 5: EdDSA Signature Verification ====================
    // Verify the issuer signed the credential data
    // Message = Poseidon(workingCapital, gstNumber, companyId, credentialTimestamp)
    component msgHash = Poseidon(4);
    msgHash.inputs[0] <== workingCapital;
    msgHash.inputs[1] <== gstNumber;
    msgHash.inputs[2] <== companyId;
    msgHash.inputs[3] <== credentialTimestamp;

    component sigVerify = EdDSAPoseidonVerifier();
    sigVerify.enabled <== 1;
    sigVerify.Ax <== issuerPubkeyX;
    sigVerify.Ay <== issuerPubkeyY;
    sigVerify.S <== issuerSigS;
    sigVerify.R8x <== issuerSigR8x;
    sigVerify.R8y <== issuerSigR8y;
    sigVerify.M <== msgHash.out;

    // ==================== CONSTRAINT 6: Issuer Public Key Commitment ====================
    // Poseidon(pubkey_x, pubkey_y) === issuerPubkeyCommitment
    component pubkeyHash = Poseidon(2);
    pubkeyHash.inputs[0] <== issuerPubkeyX;
    pubkeyHash.inputs[1] <== issuerPubkeyY;
    pubkeyHash.out === issuerPubkeyCommitment;

    // ==================== PUBLIC INPUT BINDING ====================
    // policyHash and orderNonce are public inputs, bound into the proof instance
    // by Groth16's verification equation. They don't need internal constraints
    // against each other — the backend enforces that the public-input tuple
    // matches the specific proof_request row. We do force them into the
    // constraint system so they're not optimized away:
    signal policyHashSquared;
    policyHashSquared <== policyHash * policyHash;

    signal orderNonceSquared;
    orderNonceSquared <== orderNonce * orderNonce;
}

component main {public [
    policyHash,
    requiredThreshold,
    requiredGstValid,
    maxCredentialAgeSeconds,
    orderNonce,
    supplierIdentityCommitment,
    issuerPubkeyCommitment,
    currentTimestamp,
    credentialTimestamp
]} = ProcurementCompliance();
