import { TransactionStateMachine } from './stateMachine.js';
import { PaymentRailAdapter } from './razorpayAdapter.js';
import db from '../config/database.js';
import crypto from 'crypto';
export class PaymentAuthorizationLayer {
  constructor(
    private paymentRailAdapter: PaymentRailAdapter,
    private stateMachine: TransactionStateMachine
  ) {}

  async createOrder(transactionId: string, attempt: number = 1): Promise<any> {
    const state = await this.stateMachine.getState(transactionId);
    if (state !== 'AUTHORIZED') {
      throw new Error(`Cannot create order in state ${state}`);
    }

    const txn = await db('transactions').where({ id: transactionId }).first();
    const tokenValid = await this.stateMachine.validateAuthorizationToken(transactionId, txn.authorization_token);
    if (!tokenValid) {
      throw new Error('Authorization token invalid or expired');
    }

    const idempotencyKey = `${transactionId}_create_order_${attempt}`;
    const cached = await db('idempotency_keys').where({ key: idempotencyKey }).first();
    if (cached) return typeof cached.response_snapshot === 'string' ? JSON.parse(cached.response_snapshot) : cached.response_snapshot;

    const amount = txn.amount_paise;
    const orderDetails = await this.paymentRailAdapter.createOrder({
      amount,
      currency: 'INR',
      receipt: transactionId,
      notes: { transactionId }
    }, idempotencyKey);

    const orderDbId = crypto.randomUUID();

    await db.transaction(async (trx) => {
      await trx('orders').insert({
        id: orderDbId,
        transaction_id: transactionId,
        razorpay_order_id: orderDetails.id, // Store razorpay order ID here
        receipt: transactionId,
        amount_paise: amount,
        status: 'created',
        created_at: new Date()
      });
      await trx('idempotency_keys').insert({ 
        key: idempotencyKey, 
        transaction_id: transactionId,
        action: 'create_order',
        response_snapshot: JSON.stringify(orderDetails),
        created_at: new Date()
      });
    });

    await this.stateMachine.requestTransition(transactionId, 'PAYMENT_PENDING', 'PaymentAuthorizationLayer');

    return orderDetails;
  }

  async capturePayment(transactionId: string, razorpayPaymentId: string, amountPaise: number, attempt: number = 1): Promise<any> {
    const txn = await db('transactions').where({ id: transactionId }).first();
    const tokenValid = await this.stateMachine.validateAuthorizationToken(transactionId, txn.authorization_token);
    if (!tokenValid) {
      throw new Error('Authorization token invalid or expired during capture');
    }

    const idempotencyKey = `${transactionId}_capture_payment_${attempt}`;
    
    return await this.retryWithBackoff(transactionId, async () => {
      const result = await this.paymentRailAdapter.capturePayment(razorpayPaymentId, amountPaise, idempotencyKey);
      
      const order = await db('orders').where({ transaction_id: transactionId }).first();

      await db('payments').insert({
        id: crypto.randomUUID(),
        order_id: order.id,
        razorpay_payment_id: razorpayPaymentId,
        status: 'captured',
        captured_at: new Date(),
        created_at: new Date()
      });

      await this.stateMachine.requestTransition(transactionId, 'PAYMENT_SUCCESS', 'PaymentAuthorizationLayer');
      return result;
    });
  }

  private async retryWithBackoff(transactionId: string, operation: () => Promise<any>, maxRetries = 3): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (err) {
        if (i === maxRetries - 1) throw err;
        const delay = Math.pow(2, i) * 1000;
        await new Promise(res => setTimeout(res, delay));
      }
    }
  }
}
