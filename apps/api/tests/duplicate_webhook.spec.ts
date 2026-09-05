import { describe, it, expect, vi } from 'vitest';

const processedEvents = new Set();
let stateTransitions = 0;

const processWebhook = (event) => {
  if (processedEvents.has(event.id)) {
    console.log(`Webhook ${event.id} already processed. No-op.`);
    return { status: 200, message: 'Already processed' };
  }
  processedEvents.add(event.id);
  stateTransitions++;
  return { status: 200, message: 'Processed' };
};

describe('Duplicate Webhook Test', () => {
  it('handles duplicate webhooks idempotently', () => {
    const event = { id: 'evt_123', type: 'payment.captured' };

    const res1 = processWebhook(event);
    const res2 = processWebhook(event);

    expect(res1.message).toBe('Processed');
    expect(res2.message).toBe('Already processed');
    expect(stateTransitions).toBe(1);
    expect(res2.status).toBe(200);
  });
});
