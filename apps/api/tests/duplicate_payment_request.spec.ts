import { describe, it, expect, vi, beforeEach } from 'vitest';

let ordersCreated = 0;
const idempotencyCache = new Map();

const createOrder = async (transactionId, amount) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (idempotencyCache.has(transactionId)) {
        return resolve(idempotencyCache.get(transactionId));
      }
      
      ordersCreated++;
      const order = { id: `order_${ordersCreated}`, amount };
      idempotencyCache.set(transactionId, order);
      resolve(order);
    }, 50); // Simulating async delay
  });
};

describe('Duplicate Payment Request Test', () => {
  beforeEach(() => {
    ordersCreated = 0;
    idempotencyCache.clear();
  });

  it('creates only one order for concurrent requests with same idempotency key', async () => {
    const transactionId = 'tx_auth_123';
    
    // Call createOrder twice concurrently
    const [res1, res2] = await Promise.all([
      createOrder(transactionId, 1000),
      createOrder(transactionId, 1000)
    ]);

    expect(ordersCreated).toBe(1);
    expect(res1.id).toBe('order_1');
    expect(res2.id).toBe('order_1');
    expect(res1).toEqual(res2);
  });
});
