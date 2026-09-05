import { registerTool } from '../toolRegistry.js';
import { handleVerificationFailureSchema } from '../schemas/toolSchemas.js';
import db from '../../config/database.js';

registerTool('handle_verification_failure', handleVerificationFailureSchema, async (args, context) => {
  try {
    const req = await db('proof_requests').where({ id: args.proofRequestId }).first();
    if (!req) return { error: 'Proof request not found' };
    return {
      proofRequestId: req.id,
      failureCode: req.error || 'UNKNOWN',
      status: req.status,
      recommendation: 'Consider requesting a new proof or trying an alternative policy tier.'
    };
  } catch (err: any) {
    return { error: err.message };
  }
});
