import { describe, it, expect } from 'vitest';
import { createTestCredential } from './setup';

const checkSignature = (credential) => {
  const originalCommitment = 'commit_123'; // stored reference
  if (credential.commitment !== originalCommitment) {
    return false;
  }
  return true;
};

describe('Modified Financial Data Test', () => {
  it('fails signature check when commitment is modified', () => {
    const credential = createTestCredential();
    
    // valid signature initially
    expect(checkSignature(credential)).toBe(true);

    // Modify one character in the credential commitment
    credential.commitment = 'commit_124';

    // Attempt verification
    const isValid = checkSignature(credential);

    // Assert signature check fails
    expect(isValid).toBe(false);
  });
});
