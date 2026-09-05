import { registerTool } from '../toolRegistry.js';
import { verifyZkProofSchema } from '../schemas/toolSchemas.js';
import db from '../../config/database.js';

registerTool('verify_zk_proof', verifyZkProofSchema, async (args, context) => {
  try {
    const req = await db('proof_requests').where({ id: args.proofRequestId }).first();
    if (!req) return { error: 'Proof request not found' };

    const proof = await db('proofs').where({ proof_request_id: args.proofRequestId }).first();
    let status = 'PENDING';
    if (proof) {
      status = proof.verification_result ? 'VERIFIED' : 'FAILED';
    }

    return {
      proofRequestId: req.id,
      status: status,
      error: proof ? null : 'Proof not submitted yet'
    };
  } catch (err: any) {
    return { error: err.message };
  }
});
