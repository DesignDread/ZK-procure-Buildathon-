import { FastifyPluginAsync } from 'fastify';
import { RazorpayWebhookHandler } from './razorpayWebhook.js';
import { RazorpayPaymentRailAdapter } from '../payments/razorpayAdapter.js';
import { PaymentAuthorizationLayer } from '../payments/authorizationLayer.js';
import { TransactionStateMachine } from '../payments/stateMachine.js';

const adapter = new RazorpayPaymentRailAdapter();
const stateMachine = new TransactionStateMachine();
const authorizationLayer = new PaymentAuthorizationLayer(adapter, stateMachine);
const webhookHandler = new RazorpayWebhookHandler(adapter, authorizationLayer, stateMachine);

const webhookRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.post('/api/webhooks/razorpay', { config: { rawBody: true } }, async (request, reply) => {
    const signature = request.headers['x-razorpay-signature'] as string;
    const rawBody = (request as any).rawBody as string;
    
    if (!signature || !rawBody) {
      return reply.status(400).send({ error: 'Missing signature or rawBody' });
    }

    try {
      await webhookHandler.handleWebhook(rawBody, signature);
      return reply.status(200).send({ status: 'ok' });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message });
    }
  });
};

export default webhookRoutes;
