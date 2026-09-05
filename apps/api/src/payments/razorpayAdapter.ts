import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';

export interface PaymentRailAdapter {
  createOrder(input: { amount: number; currency: string; receipt: string; notes?: any }, idempotencyKey: string): Promise<any>;
  capturePayment(paymentId: string, amountPaise: number, idempotencyKey: string): Promise<any>;
  transferToSupplier(orderId: string, linkedAccountId: string, amountPaise: number): Promise<any>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean;
}

export class RazorpayPaymentRailAdapter implements PaymentRailAdapter {
  private razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID || 'dummy',
    key_secret: env.RAZORPAY_KEY_SECRET || 'dummy'
  });

  async createOrder(input: { amount: number; currency: string; receipt: string; notes?: any }, idempotencyKey: string) {
    return await this.razorpay.orders.create({ ...input, notes: input.notes });
  }

  async capturePayment(paymentId: string, amountPaise: number, idempotencyKey: string) {
    return await this.razorpay.payments.capture(paymentId, amountPaise, 'INR');
  }

  async transferToSupplier(orderId: string, linkedAccountId: string, amountPaise: number) {
    return await this.razorpay.payments.transfer(orderId, {
      transfers: [{
        account: linkedAccountId,
        amount: amountPaise,
        currency: 'INR'
      }]
    });
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    const expectedSignature = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET || 'secret')
      .update(rawBody)
      .digest('hex');
    return expectedSignature === signatureHeader;
  }
}

export class MockPayoutAdapter implements PaymentRailAdapter {
  async createOrder(input: any, idempotencyKey: string) {
    return { id: `order_${Date.now()}`, ...input, status: 'created', _mocked: true };
  }

  async capturePayment(paymentId: string, amountPaise: number, idempotencyKey: string) {
    return { id: paymentId, amount: amountPaise, status: 'captured', _mocked: true };
  }

  async transferToSupplier(orderId: string, linkedAccountId: string, amountPaise: number) {
    return { id: `trf_${Date.now()}`, entity: 'transfer', amount: amountPaise, _mocked: true };
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string) {
    return true; // Always true for mock
  }
}
