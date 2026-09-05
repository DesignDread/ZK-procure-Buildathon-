import { vi } from 'vitest';

export const mockQuery = vi.fn();
export const mockRelease = vi.fn();

vi.mock('pg', () => {
  const Pool = vi.fn(() => ({
    query: mockQuery,
    connect: vi.fn(() => ({
      query: mockQuery,
      release: mockRelease,
    })),
  }));
  return { Pool };
});

export const mockRedisGet = vi.fn();
export const mockRedisSet = vi.fn();

vi.mock('redis', () => {
  return {
    createClient: vi.fn(() => ({
      on: vi.fn(),
      connect: vi.fn(),
      get: mockRedisGet,
      set: mockRedisSet,
    })),
  };
});

export const mockRazorpayOrdersCreate = vi.fn();

vi.mock('razorpay', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      orders: {
        create: mockRazorpayOrdersCreate,
      },
    })),
  };
});

export const createTestCredential = (overrides = {}) => {
  return {
    id: 'test-cred-123',
    issuerPublicKey: 'key_123',
    commitment: 'commit_123',
    signature: 'sig_123',
    timestamp: Date.now(),
    ...overrides
  };
};

export const createTestProof = (overrides = {}) => {
  return {
    pi_a: ['1', '2', '3'],
    pi_b: [['1', '2'], ['3', '4']],
    pi_c: ['1', '2'],
    protocol: 'groth16',
    curve: 'bn128',
    ...overrides
  };
};
