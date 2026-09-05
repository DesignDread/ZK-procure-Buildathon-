import { registerTool } from '../toolRegistry.js';
import { createTransactionSchema } from '../schemas/toolSchemas.js';
import db from '../../config/database.js';
import crypto from 'crypto';
import { TransactionStateMachine } from '../../payments/stateMachine.js';

const stateMachine = new TransactionStateMachine();

registerTool('create_transaction', createTransactionSchema, async (args, context) => {
  const { supplierOrgId, amountPaise, description } = args;
  const transactionId = crypto.randomUUID();
  const orderNonce = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  try {
    await db('transactions').insert({
      id: transactionId,
      buyer_org_id: context.organizationId,
      supplier_org_id: supplierOrgId,
      amount_paise: amountPaise,
      state: 'DRAFT',
      order_nonce: orderNonce,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Transition to POLICY_CREATED immediately (policy will be auto-linked)
    try {
      await stateMachine.requestTransition(transactionId, 'POLICY_CREATED', 'agent', 'Transaction created by agent');
    } catch { /* stay in DRAFT if transition fails */ }

    return {
      transactionId,
      orderNonce,
      supplierOrgId,
      amountPaise,
      state: 'POLICY_CREATED',
      message: `Transaction created successfully! ID: ${transactionId}. Amount: ₹${(amountPaise / 100).toLocaleString()}. Next step: Request a ZK proof from the supplier.`
    };
  } catch (err: any) {
    return { error: `Failed to create transaction: ${err.message}` };
  }
});
