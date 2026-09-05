import { TrustLevel } from './enums';

export interface CredentialIssuer {
  id: string;
  name: string;
  publicKey: string;
  trustLevel: TrustLevel | string;
  createdAt: string | Date;
}

export interface Credential {
  id: string;
  supplierOrgId: string;
  issuerId: string;
  credentialCommitment: string;
  issuedAt: string | Date;
  issuerSignature: string;
  revokedAt?: string | Date | null;
  createdAt: string | Date;
}

export interface EdDSASignature {
  R8: [string, string];
  S: string;
}

export interface EdDSAPubKey {
  x: string;
  y: string;
}

export interface SignedCredential {
  workingCapitalPaise: number | bigint | string;
  gstNumber: string;
  companyId: string;
  credentialTimestamp: number;
  issuerSignature: EdDSASignature;
  issuerPubkey: EdDSAPubKey;
}
