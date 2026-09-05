import { db } from '../config/database.js';

let poseidon: any = null;

async function initPoseidon() {
  if (!poseidon) {
    const circomlib = require('circomlibjs');
    poseidon = await circomlib.buildPoseidon();
  }
}

export class IdentityService {
  async computeCommitment(companyId: string, gstin: string, salt: string): Promise<string> {
    await initPoseidon();
    const hash = poseidon([
      BigInt('0x' + Buffer.from(companyId).toString('hex')),
      BigInt('0x' + Buffer.from(gstin).toString('hex')),
      BigInt('0x' + Buffer.from(salt).toString('hex'))
    ]);
    return poseidon.F.toString(hash);
  }

  async registerCommitment(organizationId: string, commitment: string, saltHash: string) {
    await db.query(
      `INSERT INTO identity_commitments (organization_id, commitment, salt_hash) VALUES ($1, $2, $3)`,
      [organizationId, commitment, saltHash]
    );
    return true;
  }

  async getCommitment(organizationId: string) {
    const res = await db.query(`SELECT commitment FROM identity_commitments WHERE organization_id = $1`, [organizationId]);
    return res.rows[0]?.commitment;
  }
}
