import { db } from '../config/database.js'; 
import { redis } from '../config/redis.js'; 
import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ZKVerifier {
  async verifyProof(proofRequestId: string, submittedProof: any, submittedPublicSignals: any) {
    try {
      const reqRes = await db.query(`SELECT * FROM proof_requests WHERE id = $1`, [proofRequestId]);
      if (!reqRes.rows[0]) throw new Error('Proof request not found');
      const proofRequest = reqRes.rows[0];

      if (submittedPublicSignals.policy_hash !== proofRequest.policy_hash) throw new Error('POLICY_HASH_MISMATCH');
      if (submittedPublicSignals.order_nonce !== proofRequest.order_nonce) throw new Error('NONCE_MISMATCH');
      if (submittedPublicSignals.supplier_identity_commitment !== proofRequest.supplier_identity_commitment) throw new Error('IDENTITY_MISMATCH');
      
      // Redis nonce check (gracefully handle Redis being unavailable)
      if (redis) {
        const nonceSet = await redis.setnx(`nonce:${proofRequest.order_nonce}`, 'consumed');
        if (!nonceSet) throw new Error('NONCE_ALREADY_CONSUMED');
      }

      if (new Date() > new Date(proofRequest.expires_at)) throw new Error('PROOF_REQUEST_EXPIRED');

      const credRes = await db.query(`SELECT revoked_at FROM credentials WHERE id = $1`, [proofRequest.credential_id]);
      if (credRes.rows[0]?.revoked_at) throw new Error('CREDENTIAL_REVOKED');

      const vkeyPath = path.join(__dirname, 'build', 'verification_key.json');
      const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf-8'));
      
      const isValid = await snarkjs.groth16.verify(vkey, submittedPublicSignals.raw_array, submittedProof);
      if (!isValid) throw new Error('INVALID_PROOF');

      const ageSeconds = Math.floor(Date.now() / 1000) - submittedPublicSignals.credential_timestamp;
      if (ageSeconds > 86400 * 30) throw new Error('CREDENTIAL_EXPIRED'); 

      await db.query(`UPDATE proof_requests SET status = 'AUTHORIZED' WHERE id = $1`, [proofRequestId]);
      await db.query(`INSERT INTO audit_logs (event, proof_request_id) VALUES ('VERIFICATION_SUCCESS', $1)`, [proofRequestId]);
      
      return { success: true };
    } catch (error: any) {
      await db.query(`UPDATE proof_requests SET status = 'FAILED', error = $1 WHERE id = $2`, [error.message, proofRequestId]);
      await db.query(`INSERT INTO audit_logs (event, proof_request_id, error) VALUES ('VERIFICATION_FAILED', $1, $2)`, [proofRequestId, error.message]);
      return { success: false, error: error.message };
    }
  }
}
