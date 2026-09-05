export interface Groth16Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface ZKPublicSignals {
  policyHash: string;
  requiredThreshold: string | number;
  requiredGstValid: string | number;
  maxCredentialAgeSeconds: string | number;
  orderNonce: string;
  supplierIdentityCommitment: string;
  issuerPubkeyCommitment: string;
  currentTimestamp: string | number;
  credentialTimestamp: string | number;
}

export interface ProofRequest {
  id: string;
  transactionId: string;
  credentialId: string;
  policyHash: string;
  orderNonce: string;
  supplierIdentityCommitment: string;
  requestedAt: string | Date;
  expiresAt: string | Date;
}

export interface Proof {
  id: string;
  proofRequestId: string;
  nonce: string;
  nonceConsumedAt?: string | Date | null;
  proofJson: Groth16Proof;
  publicSignals: string[];
  verificationResult?: boolean | null;
  verifiedAt?: string | Date | null;
  createdAt: string | Date;
}
