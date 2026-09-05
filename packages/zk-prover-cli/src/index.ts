/**
 * ZK Prover Library
 * 
 * Provides proof generation functionality that runs ENTIRELY on the supplier's machine.
 * Private inputs (working capital, etc.) NEVER leave this process.
 * 
 * Can be used as a CLI tool or imported as a library (for browser integration).
 */

// @ts-nocheck - snarkjs and circomlibjs lack proper types
import * as snarkjs from 'snarkjs';

export interface ProofInputs {
  // Public inputs
  policyHash: string;
  requiredThreshold: string;
  requiredGstValid: string;
  maxCredentialAgeSeconds: string;
  orderNonce: string;
  supplierIdentityCommitment: string;
  issuerPubkeyCommitment: string;
  currentTimestamp: string;
  credentialTimestamp: string;
  
  // Private inputs - NEVER TRANSMITTED
  workingCapital: string;
  gstNumber: string;
  companyId: string;
  salt: string;
  issuerPubkeyX: string;
  issuerPubkeyY: string;
  issuerSigR8x: string;
  issuerSigR8y: string;
  issuerSigS: string;
}

export interface GeneratedProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
}

export interface VerificationResult {
  valid: boolean;
  publicSignals: string[];
}

/**
 * Generate a Groth16 ZK proof.
 * 
 * This function runs on the supplier's machine. The private inputs
 * (workingCapital, gstNumber, companyId, salt, signature components)
 * are used to compute a witness and generate a proof, but they are
 * NEVER included in the output — only the proof and public signals.
 * 
 * @param inputs - All circuit inputs (public + private)
 * @param wasmPath - Path to the compiled circuit WASM file
 * @param zkeyPath - Path to the proving key (.zkey file)
 * @returns The proof and public signals
 */
export async function generateProof(
  inputs: ProofInputs,
  wasmPath: string,
  zkeyPath: string
): Promise<GeneratedProof> {
  console.log('🔒 Generating ZK proof locally...');
  console.log('   Private inputs stay on this machine.');
  console.log('   Only the proof and public signals will be transmitted.');

  // Build the full input object for the circuit
  const circuitInputs = {
    // Public inputs
    policyHash: inputs.policyHash,
    requiredThreshold: inputs.requiredThreshold,
    requiredGstValid: inputs.requiredGstValid,
    maxCredentialAgeSeconds: inputs.maxCredentialAgeSeconds,
    orderNonce: inputs.orderNonce,
    supplierIdentityCommitment: inputs.supplierIdentityCommitment,
    issuerPubkeyCommitment: inputs.issuerPubkeyCommitment,
    currentTimestamp: inputs.currentTimestamp,
    credentialTimestamp: inputs.credentialTimestamp,
    
    // Private inputs
    workingCapital: inputs.workingCapital,
    gstNumber: inputs.gstNumber,
    companyId: inputs.companyId,
    salt: inputs.salt,
    issuerPubkeyX: inputs.issuerPubkeyX,
    issuerPubkeyY: inputs.issuerPubkeyY,
    issuerSigR8x: inputs.issuerSigR8x,
    issuerSigR8y: inputs.issuerSigR8y,
    issuerSigS: inputs.issuerSigS,
  };

  // Generate witness and proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInputs,
    wasmPath,
    zkeyPath
  );

  console.log('✅ Proof generated successfully!');
  console.log(`   Public signals: ${publicSignals.length} values`);
  console.log('   Private inputs have been used and discarded.');

  return { proof, publicSignals };
}

/**
 * Verify a Groth16 ZK proof.
 * 
 * This can be run by anyone (buyer, platform, third party) since
 * it only requires the proof, public signals, and verification key.
 * No private data is needed.
 * 
 * @param proof - The Groth16 proof
 * @param publicSignals - The public signals
 * @param vkeyPath - Path to the verification key JSON file
 * @returns Whether the proof is valid
 */
export async function verifyProof(
  proof: GeneratedProof['proof'],
  publicSignals: string[],
  vkeyPath: string
): Promise<VerificationResult> {
  const { readFileSync } = await import('fs');
  const vkey = JSON.parse(readFileSync(vkeyPath, 'utf-8'));
  
  const valid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  
  return { valid, publicSignals };
}

/**
 * Verify a proof using an in-memory verification key (for browser/API use).
 */
export async function verifyProofWithKey(
  proof: GeneratedProof['proof'],
  publicSignals: string[],
  vkey: object
): Promise<boolean> {
  return snarkjs.groth16.verify(vkey, publicSignals, proof);
}

/**
 * Map public signal array indices to named fields.
 * Order matches the circuit's main component public input declaration.
 */
export function parsePublicSignals(signals: string[]): Record<string, string> {
  const names = [
    'policyHash',
    'requiredThreshold',
    'requiredGstValid',
    'maxCredentialAgeSeconds',
    'orderNonce',
    'supplierIdentityCommitment',
    'issuerPubkeyCommitment',
    'currentTimestamp',
    'credentialTimestamp',
  ];
  
  const parsed: Record<string, string> = {};
  for (let i = 0; i < names.length && i < signals.length; i++) {
    parsed[names[i]] = signals[i];
  }
  return parsed;
}

/**
 * Generate a mock proof for demo/testing when the real circuit isn't compiled.
 * The proof is structurally correct but mathematically trivial.
 * Clearly labeled as SIMULATED.
 */
export function generateMockProof(inputs: ProofInputs): GeneratedProof {
  console.log('⚠️  DEMO MODE: Generating simulated proof (not cryptographically valid)');
  
  return {
    proof: {
      pi_a: ['0', '0', '1'],
      pi_b: [['0', '0'], ['0', '0'], ['1', '0']],
      pi_c: ['0', '0', '1'],
      protocol: 'groth16',
      curve: 'bn128',
    },
    publicSignals: [
      inputs.policyHash,
      inputs.requiredThreshold,
      inputs.requiredGstValid,
      inputs.maxCredentialAgeSeconds,
      inputs.orderNonce,
      inputs.supplierIdentityCommitment,
      inputs.issuerPubkeyCommitment,
      inputs.currentTimestamp,
      inputs.credentialTimestamp,
    ],
  };
}
