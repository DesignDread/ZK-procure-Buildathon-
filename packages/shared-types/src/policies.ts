export interface PolicyCanonicalShape {
  requiredThresholdPaise: number;
  requiredGstValid: boolean;
  maxCredentialAgeSeconds: number;
  policyName: string;
}

export interface Policy {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string | Date;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  versionNumber: number;
  canonicalJson: PolicyCanonicalShape;
  regoModule: string;
  createdAt: string | Date;
}

export interface PolicyHash {
  id: string;
  policyVersionId: string;
  sha256Hash: string;
  poseidonHash?: string | null;
  createdAt: string | Date;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  tier: string;
  thresholdPaise: number;
  description: string;
  maxCredentialAgeSeconds?: number;
  requiredGstValid?: boolean;
}
