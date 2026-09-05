import { PaymentRailAdapter } from '../payments/razorpayAdapter.js';
import { PaymentAuthorizationLayer } from '../payments/authorizationLayer.js';
import { TransactionStateMachine } from '../payments/stateMachine.js';
import db from '../config/database.js';

export class RazorpayWebhookHandler {
  constructor(
    private adapter: PaymentRailAdapter,
    private authorizationLayer: PaymentAuthorizationLayer,
    private stateMachine: TransactionStateMachine
  ) {}

  async handleWebhook(rawBody: string, signatureHeader: string): Promise<void> {
    if (!this.adapter.verifyWebhookSignature(rawBody, signatureHeader)) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.headers && payload.headers['x-razorpay-event-id'] 
      || payload.id || `evt_${Date.now()}`; 

    const inserted = await db('webhook_events')
      .insert({ razorpay_event_id: eventId, payload: rawBody, created_at: new Date() })
      .onConflict('razorpay_event_id')
      .ignore();
    
    if (inserted.length === 0 && inserted.rowCount === 0) {
      console.log(`Duplicate webhook event ${eventId}`);
      return; 
    }

    const event = payload.event;
    const entity = payload.payload.payment?.entity || payload.payload.order?.entity;
    const transactionId = entity?.notes?.transactionId;

    if (!transactionId) {
      console.log(`No transactionId in webhook ${eventId}`);
      return;
    }

    try {
      if (event === 'payment.authorized') {
        await this.authorizationLayer.capturePayment(transactionId, entity.id, entity.amount);
      } else if (event === 'payment.captured') {
        await this.stateMachine.requestTransition(transactionId, 'PAYMENT_SUCCESS', 'webhook', eventId);
      } else if (event === 'order.paid') {
        await this.stateMachine.requestTransition(transactionId, 'SETTLED', 'webhook', eventId);
      } else if (event === 'payment.failed') {
        await this.stateMachine.requestTransition(transactionId, 'PAYMENT_FAILED', 'webhook', eventId);
      }
      
      await db('audit_logs').insert({
        entity_id: transactionId,
        entity_type: 'transaction',
        action: 'WEBHOOK_PROCESSED',
        details: JSON.stringify({ event, eventId }),
        actor: 'system',
        created_at: new Date()
      });
    } catch (err: any) {
      console.error(`Webhook processing failed for ${eventId}: ${err.message}`);
    }
  }
}
