export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('supplier_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  getCredentials: () => fetchWithAuth('/supplier/credentials'),
  getProofRequests: () => fetchWithAuth('/supplier/proof-requests'),
  submitProof: (requestId: string, proofData: any) => fetchWithAuth(`/supplier/proof-requests/${requestId}/submit`, { method: 'POST', body: JSON.stringify(proofData) }),
};
