import { FastifyPluginAsync } from 'fastify';
import { RazorpayPaymentRailAdapter, MockPayoutAdapter } from './razorpayAdapter.js';
import { PaymentAuthorizationLayer } from './authorizationLayer.js';
import { TransactionStateMachine } from './stateMachine.js';
import { env } from '../config/env.js';
import db from '../config/database.js';
import crypto from 'crypto';

const adapter = env.NODE_ENV === 'production'
  ? new RazorpayPaymentRailAdapter()
  : new MockPayoutAdapter();

const stateMachine = new TransactionStateMachine();
const authorizationLayer = new PaymentAuthorizationLayer(adapter, stateMachine);

const paymentsRoutes: FastifyPluginAsync = async (fastify) => {

  // POST /api/payments/:transactionId/create-order
  fastify.post('/:transactionId/create-order', async (request, reply) => {
    const { transactionId } = request.params as { transactionId: string };
    try {
      await stateMachine.issueAuthorizationToken(transactionId);
      const orderDetails = await authorizationLayer.createOrder(transactionId);
      return reply.send({
        orderId: orderDetails.id,
        amount: orderDetails.amount,
        currency: orderDetails.currency || 'INR',
        keyId: env.RAZORPAY_KEY_ID,
        transactionId,
        _mocked: orderDetails._mocked || false,
      });
    } catch (err: any) {
      fastify.log.error(`[payments/create-order] ${err.message}`);
      return reply.status(400).send({ error: err.message });
    }
  });

  // POST /api/payments/:transactionId/capture
  fastify.post('/:transactionId/capture', async (request, reply) => {
    const { transactionId } = request.params as { transactionId: string };
    const { razorpayPaymentId } = request.body as any;
    if (!razorpayPaymentId) return reply.status(400).send({ error: 'razorpayPaymentId is required' });
    try {
      const txn = await db('transactions').where({ id: transactionId }).first();
      if (!txn) return reply.status(404).send({ error: 'Transaction not found' });
      await authorizationLayer.capturePayment(transactionId, razorpayPaymentId, Number(txn.amount_paise));
      try {
        const updated = await db('transactions').where({ id: transactionId }).first();
        if (updated?.state === 'PAYMENT_SUCCESS') {
          await stateMachine.requestTransition(transactionId, 'SETTLED', 'system', 'Payment settled');
        }
      } catch { }
      return reply.send({ success: true, transactionId, razorpayPaymentId, state: 'SETTLED' });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // GET /api/payments/:transactionId/status
  fastify.get('/:transactionId/status', async (request, reply) => {
    const { transactionId } = request.params as { transactionId: string };
    try {
      const txn = await db('transactions').where({ id: transactionId }).first();
      if (!txn) return reply.status(404).send({ error: 'Transaction not found' });
      const order = await db('orders').where({ transaction_id: transactionId }).first();
      let payment = null;
      if (order) {
        payment = await db('payments').where({ order_id: order.id }).first();
      }
      return { transactionId, state: txn.state, amount_paise: txn.amount_paise, authorized_at: txn.authorized_at, order: order || null, payment: payment || null };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // POST /api/payments/:transactionId/mock-settle (DEV ONLY)
  fastify.post('/:transactionId/mock-settle', async (request, reply) => {
    if (env.NODE_ENV === 'production') return reply.status(403).send({ error: 'Not available in production' });
    const { transactionId } = request.params as { transactionId: string };
    try {
      const txn = await db('transactions').where({ id: transactionId }).first();
      if (!txn) return reply.status(404).send({ error: 'Transaction not found' });
      if (txn.state !== 'AUTHORIZED' && txn.state !== 'PAYMENT_PENDING') {
        return reply.status(400).send({ error: `Must be AUTHORIZED or PAYMENT_PENDING, currently: ${txn.state}` });
      }
      if (txn.state === 'AUTHORIZED') {
        await stateMachine.issueAuthorizationToken(transactionId);
      }
      
      const mockOrderId = crypto.randomUUID();
      const mockPaymentId = crypto.randomUUID();
      
      await db('orders').insert({
        id: mockOrderId,
        transaction_id: transactionId,
        razorpay_order_id: `mock_order_${Date.now()}`,
        receipt: `mock_receipt_${Date.now()}`,
        amount_paise: Number(txn.amount_paise),
        currency: 'INR',
        status: 'created',
        created_at: new Date()
      }).onConflict('transaction_id').ignore();

      const existingOrder = await db('orders').where({ transaction_id: transactionId }).first();

      await db('payments').insert({ 
        id: mockPaymentId, 
        order_id: existingOrder.id, 
        razorpay_payment_id: `pay_mock_${Date.now()}`, 
        status: 'captured', 
        captured_at: new Date(),
        created_at: new Date() 
      }).onConflict('razorpay_payment_id').ignore();

      if (txn.state === 'AUTHORIZED') {
        await stateMachine.requestTransition(transactionId, 'PAYMENT_PENDING', 'mock-settle', 'Mock payment initiated');
      }
      await stateMachine.requestTransition(transactionId, 'PAYMENT_SUCCESS', 'mock-settle', 'Mock payment captured');
      await stateMachine.requestTransition(transactionId, 'SETTLED', 'mock-settle', 'Mock payment settled');
      return { success: true, transactionId, mockPaymentId, finalState: 'SETTLED', message: '[DEV] Transaction fully settled via mock payment.' };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
};

export default paymentsRoutes;
