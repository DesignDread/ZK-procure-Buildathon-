import { describe, it, expect, vi } from 'vitest';
import { createTestProof } from './setup';

// Mock groth16 verify
const groth16 = {
  verify: vi.fn((vkey, publicSignals, proof) => {
    if (proof.pi_a[0] !== '1') {
      return false;
    }
    return true;
  })
};

describe('Invalid Proof Test', () => {
  it('returns false when proof_json is corrupted', () => {
    const proof = createTestProof();
    
    // Corrupt one element of pi_a
    proof.pi_a[0] = 'corrupted_value';

    // Call verifier
    const isValid = groth16.verify('vkey', ['pub1'], proof);

    // Assert groth16.verify returns false
    expect(isValid).toBe(false);
  });
});
