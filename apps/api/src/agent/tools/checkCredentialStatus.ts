import { registerTool } from '../toolRegistry.js';
import { checkCredentialStatusSchema } from '../schemas/toolSchemas.js';
import db from '../../config/database.js';

registerTool('check_credential_status', checkCredentialStatusSchema, async (args, context) => {
  try {
    const cred = await db('credentials').where({ id: args.credentialId }).first();
    if (!cred) return { status: 'NOT_FOUND', message: 'Credential not found' };
    return {
      id: cred.id,
      status: cred.revoked_at ? 'REVOKED' : (cred.issued_at ? 'ACTIVE' : 'PENDING'),
      issued_at: cred.issued_at,
      revoked_at: cred.revoked_at
    };
  } catch (err: any) {
    return { status: 'ERROR', message: err.message };
  }
});
