const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function apiFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export const api = {
  // Transactions
  getTransactions: () => apiFetch('/transactions'),
  getTransaction: (id: string) => apiFetch(`/transactions/${id}`),
  createTransaction: (data: any) =>
    apiFetch('/transactions', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: () => apiFetch('/suppliers/search'),
  getSupplier: (id: string) => apiFetch(`/suppliers/${id}`),

  // Agent
  sendMessage: (payload: { userId: string; organizationId: string; sessionId: string; message: string }) =>
    apiFetch('/agent/message', { method: 'POST', body: JSON.stringify(payload) }),
  getAgentTrace: (runId: string) => apiFetch(`/agent/runs/${runId}/trace`),

  // Payments
  createOrder: (transactionId: string) =>
    apiFetch(`/payments/${transactionId}/create-order`, { method: 'POST', body: JSON.stringify({}) }),
  capturePayment: (transactionId: string, razorpayPaymentId: string, razorpayOrderId?: string, razorpaySignature?: string) =>
    apiFetch(`/payments/${transactionId}/capture`, {
      method: 'POST',
      body: JSON.stringify({ razorpayPaymentId, razorpayOrderId, razorpaySignature }),
    }),
  getPaymentStatus: (transactionId: string) => apiFetch(`/payments/${transactionId}/status`),
  mockSettle: (transactionId: string) =>
    apiFetch(`/payments/${transactionId}/mock-settle`, { method: 'POST', body: JSON.stringify({}) }),
};
