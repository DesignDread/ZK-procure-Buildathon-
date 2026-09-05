import { PaymentStatus, IdempotencyAction } from './enums';

export interface Order {
  id: string;
  transactionId: string;
  razorpayOrderId?: string | null;
  receipt: string;
  amountPaise: number | bigint | string;
  currency: string;
  status: string;
  createdAt: string | Date;
}

export interface Payment {
  id: string;
  orderId: string;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  status: PaymentStatus;
  capturedAt?: string | Date | null;
  createdAt: string | Date;
}

export interface WebhookEvent {
  id: string;
  razorpayEventId: string;
  eventType: string;
  signatureValid: boolean;
  rawPayload: Record<string, unknown> | unknown;
  processedAt?: string | Date | null;
  createdAt: string | Date;
}

export interface IdempotencyKey {
  id: string;
  key: string;
  transactionId: string;
  action: IdempotencyAction;
  responseSnapshot?: Record<string, unknown> | null;
  createdAt: string | Date;
}

export interface CreateOrderInput {
  amountPaise: number | bigint | string;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface OrderResult {
  razorpayOrderId: string;
  status: string;
}

export interface CaptureResult {
  razorpayPaymentId: string;
  status: string;
  capturedAt: string | Date;
}

export interface TransferResult {
  transferId: string;
  status: string;
}

export interface PaymentRailAdapter {
  createOrder(input: CreateOrderInput, idempotencyKey: string): Promise<OrderResult>;
  capturePayment(paymentId: string, amountPaise: number, idempotencyKey: string): Promise<CaptureResult>;
  transferToSupplier(orderId: string, linkedAccountId: string, amountPaise: number): Promise<TransferResult>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean;
}
