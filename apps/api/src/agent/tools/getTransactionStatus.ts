import { registerTool } from '../toolRegistry.js';
import { getTransactionStatusSchema } from '../schemas/toolSchemas.js';
import db from '../../config/database.js';

registerTool('get_transaction_status', getTransactionStatusSchema, async (args, context) => {
  try {
    const txn = await db('transactions')
      .select('*')
      .where('id', args.transactionId)
      .first();

    if (!txn) return { error: 'Transaction not found', transactionId: args.transactionId };

    return {
      transactionId: txn.id,
      state: txn.state,
      amount_paise: txn.amount_paise,
      created_at: txn.created_at,
      updated_at: txn.updated_at
    };
  } catch (err: any) {
    return { error: err.message };
  }
});
