import { describe, it, expect } from 'vitest';

const checkProofAge = (proofTimestamp, currentTimestamp, maxAgeSeconds) => {
  if (currentTimestamp - proofTimestamp > maxAgeSeconds * 1000) {
    return { success: false, error: 'CREDENTIAL_EXPIRED' };
  }
  return { success: true };
};

describe('Expired Proof Test', () => {
  it('rejects proof when credential_timestamp is older than max_credential_age_seconds', () => {
    const maxCredentialAgeSeconds = 900;
    const currentTimestamp = Date.now();
    const proofTimestamp = currentTimestamp - (1000 * 1000); // 1000 seconds old

    const result = checkProofAge(proofTimestamp, currentTimestamp, maxCredentialAgeSeconds);

    expect(result.success).toBe(false);
    expect(result.error).toBe('CREDENTIAL_EXPIRED');
  });
});
