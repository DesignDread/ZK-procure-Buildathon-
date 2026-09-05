import { computePolicyHash, PolicyCanonicalShape } from './canonicalize';
import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class PolicyService {
  async createPolicy(name: string, createdBy: string, shape: PolicyCanonicalShape) {
    const { canonicalJson, sha256Hash } = computePolicyHash(shape);
    const policyId = uuidv4();
    const versionId = uuidv4();

    await db.query(`INSERT INTO policies (id, name, created_by) VALUES ($1, $2, $3)`, [policyId, name, createdBy]);
    await db.query(`INSERT INTO policy_versions (id, policy_id, canonical_shape, created_at) VALUES ($1, $2, $3, NOW())`, [versionId, policyId, canonicalJson]);
    await db.query(`INSERT INTO policy_hashes (hash, policy_version_id) VALUES ($1, $2)`, [sha256Hash, versionId]);

    return { policyId, versionId, sha256Hash };
  }

  async getPolicyTemplates() {
    return [
      { id: 'tier_1', name: 'Tier 1 Standard', shape: { threshold: 1000000, required_freshness: 3600 * 24 * 30 } },
      { id: 'tier_2', name: 'Tier 2 Advanced', shape: { threshold: 5000000, required_freshness: 3600 * 24 * 15 } }
    ];
  }

  async getPolicyVersion(policyVersionId: string) {
    const res = await db.query(`
      SELECT pv.*, ph.hash
      FROM policy_versions pv
      JOIN policy_hashes ph ON pv.id = ph.policy_version_id
      WHERE pv.id = $1
    `, [policyVersionId]);
    return res.rows[0];
  }

  async getPolicyByHash(sha256Hash: string) {
    const res = await db.query(`
      SELECT ph.*, pv.policy_id, pv.canonical_shape
      FROM policy_hashes ph
      JOIN policy_versions pv ON ph.policy_version_id = pv.id
      WHERE ph.hash = $1
    `, [sha256Hash]);
    return res.rows[0];
  }
}
