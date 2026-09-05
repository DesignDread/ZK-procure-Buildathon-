import { describe, it, expect } from 'vitest';

const verifyIdentity = (transactionSupplierCommitment, proofSupplierCommitment) => {
  if (transactionSupplierCommitment !== proofSupplierCommitment) {
    return { success: false, state: 'IDENTITY_MISMATCH' };
  }
  return { success: true, state: 'VERIFIED' };
};

describe('Wrong Identity Test', () => {
  it('transitions state to IDENTITY_MISMATCH when supplier commitment mismatches', () => {
    const supplierACommitment = 'comm_supplierA';
    const supplierBCommitment = 'comm_supplierB';

    const transaction = { supplierCommitment: supplierACommitment };
    
    // Submit proof with Supplier B's identity commitment
    const result = verifyIdentity(transaction.supplierCommitment, supplierBCommitment);

    expect(result.success).toBe(false);
    expect(result.state).toBe('IDENTITY_MISMATCH');
  });
});
