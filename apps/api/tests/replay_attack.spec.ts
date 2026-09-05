import { describe, it, expect, vi } from 'vitest';

const verifyProofRequest = (proof, transactionNonce) => {
  if (proof.nonce !== transactionNonce) {
    return { success: false, error: 'PUBLIC INPUT MISMATCH' };
  }
  return { success: true };
};

const groth16Verify = vi.fn();

describe('Replay Attack Test', () => {
  it('rejects proof submitted against wrong order due to nonce mismatch', () => {
    const transactionA = { nonce: 'nonce_A' };
    const transactionB = { nonce: 'nonce_B' };

    const proofForA = { nonce: 'nonce_A', data: 'proof_data' };

    // Submit proof against Transaction B
    const result = verifyProofRequest(proofForA, transactionB.nonce);

    expect(result.success).toBe(false);
    expect(result.error).toBe('PUBLIC INPUT MISMATCH');
    expect(groth16Verify).not.toHaveBeenCalled();
  });
});
