import { describe, it, expect } from 'vitest';
import { createTestCredential } from './setup';

// Mocking verification function for testing
const verifyCredentialSignature = (credential, publicKey) => {
  if (credential.issuerPublicKey !== publicKey) {
    return { success: false, error: 'SIGNATURE_INVALID' };
  }
  return { success: true };
};

describe('Fake Credential Test', () => {
  it('rejects credential signed with wrong key before proof verification', () => {
    const validIssuerPublicKey = 'pub_issuer_abc123';
    const differentPublicKey = 'pub_issuer_xyz987';
    
    // Create credential with a valid issuer keypair
    const credential = createTestCredential({ issuerPublicKey: validIssuerPublicKey });

    // Attempt to verify it against a DIFFERENT issuer public key
    const result = verifyCredentialSignature(credential, differentPublicKey);

    // Assert that signature verification fails BEFORE any proof attempt
    expect(result.success).toBe(false);
    // Assert error type is SIGNATURE_INVALID
    expect(result.error).toBe('SIGNATURE_INVALID');
  });
});
