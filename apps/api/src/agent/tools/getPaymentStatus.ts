import { registerTool } from '../toolRegistry.js';
import { getPaymentStatusSchema } from '../schemas/toolSchemas.js';
import db from '../../config/database.js';

registerTool('get_payment_status', getPaymentStatusSchema, async (args, context) => {
  try {
    const txn = await db('transactions').where({ id: args.transactionId }).first();
    if (!txn) return { error: 'Transaction not found' };
    return {
      transactionId: txn.id,
      state: txn.state,
      amount_paise: txn.amount_paise
    };
  } catch (err: any) {
    return { error: err.message };
  }
});
