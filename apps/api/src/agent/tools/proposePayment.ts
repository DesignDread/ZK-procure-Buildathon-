import { registerTool } from '../toolRegistry.js';
import { proposePaymentSchema } from '../schemas/toolSchemas.js';
import db from '../../config/database.js';

registerTool('propose_payment', proposePaymentSchema, async (args, context) => {
  try {
    const txn = await db('transactions')
      .select('*')
      .where('id', args.transactionId)
      .first();

    if (!txn) return { error: 'Transaction not found' };
    if (txn.state !== 'AUTHORIZED') {
      return { error: `Cannot propose payment. Transaction is in state: ${txn.state}` };
    }

    return {
      requiresHumanApproval: true,
      transactionId: args.transactionId,
      amount_paise: txn.amount_paise,
      message: 'Payment proposed. Waiting for human approval via UI.'
    };
  } catch (err: any) {
    return { error: err.message };
  }
});
