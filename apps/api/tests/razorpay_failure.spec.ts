import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockRazorpayOrdersCreate } from './setup';

class AuthorizationLayer {
  async createOrder(idempotencyKey) {
    try {
      await mockRazorpayOrdersCreate({ amount: 1000, receipt: idempotencyKey });
      return { status: 'PAYMENT_PENDING' };
    } catch (e) {
      return { status: 'PAYMENT_TIMEOUT' };
    }
  }
}

describe('Razorpay Failure Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles timeout and successful retry', async () => {
    const authLayer = new AuthorizationLayer();
    const idempotencyKey = 'idem_key_123';

    // Mock to throw on first call, succeed on second
    mockRazorpayOrdersCreate
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce({ id: 'order_xyz' });

    // First call
    const res1 = await authLayer.createOrder(idempotencyKey);
    expect(res1.status).toBe('PAYMENT_TIMEOUT');

    // Retry
    const res2 = await authLayer.createOrder(idempotencyKey);
    expect(res2.status).toBe('PAYMENT_PENDING');

    expect(mockRazorpayOrdersCreate).toHaveBeenCalledTimes(2);
    expect(mockRazorpayOrdersCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({ receipt: idempotencyKey }));
    expect(mockRazorpayOrdersCreate).toHaveBeenNthCalledWith(2, expect.objectContaining({ receipt: idempotencyKey }));
  });
});
