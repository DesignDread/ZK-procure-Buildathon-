import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { MockFip } from './mockFip';

const mockFip = new MockFip();

export class CredentialService {
  async requestCredential(supplierOrgId: string, issuerId: string) {
    const credentialId = uuidv4();
    await db.query(`INSERT INTO credentials (id, supplier_org_id, issuer_id, status) VALUES ($1, $2, $3, 'REQUESTED')`, [credentialId, supplierOrgId, issuerId]);
    return { credentialId };
  }

  async issueCredential(supplierOrgId: string) {
    const { privateKey } = await mockFip.generateKeyPair();
    const supplierData = {
      workingCapitalPaise: 10000000,
      gstNumber: '29ABCDE1234F1Z5',
      companyId: supplierOrgId,
      timestamp: Math.floor(Date.now() / 1000)
    };
    const signedCredential = await mockFip.issueCredential(privateKey, supplierData);
    
    return signedCredential; 
  }

  async verifySignature(credentialId: string) {
    return true; 
  }

  async isRevoked(credentialId: string) {
    const res = await db.query(`SELECT revoked_at FROM credentials WHERE id = $1`, [credentialId]);
    return res.rows[0]?.revoked_at !== null;
  }

  async checkFreshness(credentialId: string, maxAgeSeconds: number) {
    const res = await db.query(`SELECT issued_at FROM credentials WHERE id = $1`, [credentialId]);
    if (!res.rows[0]) return false;
    const age = Math.floor(Date.now() / 1000) - new Date(res.rows[0].issued_at).getTime() / 1000;
    return age <= maxAgeSeconds;
  }

  async revokeCredential(credentialId: string) {
    await db.query(`UPDATE credentials SET revoked_at = NOW() WHERE id = $1`, [credentialId]);
    return true;
  }
}
