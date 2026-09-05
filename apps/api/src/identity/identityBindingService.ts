import { db } from '../config/database.js';
import { IdentityService } from './identityService';

const identityService = new IdentityService();

export class IdentityBindingService {
  async verifyMatch(transactionId: string, submittedCommitment: string): Promise<boolean> {
    const txRes = await db.query(`SELECT supplier_org_id FROM transactions WHERE id = $1`, [transactionId]);
    if (!txRes.rows[0]) return false;
    
    const supplierOrgId = txRes.rows[0].supplier_org_id;
    const registeredCommitment = await identityService.getCommitment(supplierOrgId);
    
    return registeredCommitment === submittedCommitment;
  }
}
