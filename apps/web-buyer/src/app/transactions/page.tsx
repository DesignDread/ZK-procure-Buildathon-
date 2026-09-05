'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StateBadge from '@/components/StateBadge';
import { Loader2, Plus } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchTransactions() {
  // Use hardcoded demo userId/orgId since auth is not enforced for agent flow
  const res = await fetch(`${API_BASE}/transactions`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) return [];
  return res.json();
}

export default function TransactionsPage() {
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions()
      .then(setTxns)
      .catch(() => setTxns([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Link href="/chat" className="flex items-center gap-2 bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          <Plus className="w-4 h-4" /> New Procurement
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
      ) : txns.length === 0 ? (
        <div className="bg-secondary border border-muted rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-4">No transactions yet.</p>
          <Link href="/chat" className="bg-accent hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors inline-block">
            Start a Procurement
          </Link>
        </div>
      ) : (
        <div className="bg-secondary border border-muted rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-muted">
                <th className="p-4 font-medium text-gray-300">ID</th>
                <th className="p-4 font-medium text-gray-300">Description</th>
                <th className="p-4 font-medium text-gray-300">Amount</th>
                <th className="p-4 font-medium text-gray-300">Created</th>
                <th className="p-4 font-medium text-gray-300">State</th>
                <th className="p-4 font-medium text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {txns.map((txn: any) => (
                <tr key={txn.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-accent text-xs">
                    <Link href={`/transactions/${txn.id}`}>{txn.id.slice(0, 8)}...</Link>
                  </td>
                  <td className="p-4 text-sm">{txn.description || txn.order_nonce || '—'}</td>
                  <td className="p-4 font-mono text-sm">
                    {txn.amount_paise ? `Rs.${(txn.amount_paise / 100).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="p-4 text-gray-400 text-xs">
                    {txn.created_at ? new Date(txn.created_at).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="p-4">
                    <StateBadge state={txn.state as any} />
                  </td>
                  <td className="p-4">
                    <Link href={`/transactions/${txn.id}`} className="text-sm bg-muted hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
