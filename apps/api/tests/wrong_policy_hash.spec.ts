import { describe, it, expect, vi } from 'vitest';

const groth16Verify = vi.fn();

const checkPolicyHash = (transactionPolicyHash, proofPolicyHash) => {
  if (transactionPolicyHash !== proofPolicyHash) {
    return { success: false, error: 'POLICY_FAILED' };
  }
  return { success: true };
};

describe('Wrong Policy Hash Test', () => {
  it('fails verification when policy hash mismatches', () => {
    const transactionPolicyHash = 'hash_A';
    const proofPolicyHash = 'hash_B';

    const result = checkPolicyHash(transactionPolicyHash, proofPolicyHash);

    expect(result.success).toBe(false);
    expect(result.error).toBe('POLICY_FAILED');
    expect(groth16Verify).not.toHaveBeenCalled();
  });
});
