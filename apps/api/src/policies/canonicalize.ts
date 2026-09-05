import * as crypto from 'crypto';

export interface PolicyCanonicalShape {
  [key: string]: any;
}

export function canonicalize(policyShape: PolicyCanonicalShape): string {
  if (policyShape === null || typeof policyShape !== 'object') {
    return JSON.stringify(policyShape);
  }

  if (Array.isArray(policyShape)) {
    const arr = policyShape.map(canonicalize);
    return `[${arr.join(',')}]`;
  }

  const keys = Object.keys(policyShape).sort();
  let result = '{';
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result += `"${key}":${canonicalize(policyShape[key])}`;
    if (i < keys.length - 1) {
      result += ',';
    }
  }
  result += '}';
  return result;
}

export function computeSha256Hash(canonicalJson: string): string {
  return crypto.createHash('sha256').update(canonicalJson).digest('hex');
}

export function computePolicyHash(policyShape: PolicyCanonicalShape): { canonicalJson: string, sha256Hash: string } {
  const canonicalJson = canonicalize(policyShape);
  const sha256Hash = computeSha256Hash(canonicalJson);
  return { canonicalJson, sha256Hash };
}
