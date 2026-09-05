'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import StateBadge from '@/components/StateBadge';
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { openCheckout } from '@/lib/razorpay';

type Transaction = {
  id: string;
  state: string;
  amount_paise: number;
  description?: string;
  order_nonce?: string;
  authorized_at?: string;
  created_at?: string;
};

function getStepIndex(state: string): number {
  const map: Record<string, number> = {
    DRAFT: 0, POLICY_CREATED: 1, SUPPLIER_SELECTED: 1,
    AWAITING_CREDENTIAL: 2, PROOF_GENERATING: 2, VERIFYING: 2,
    AUTHORIZED: 3, PAYMENT_PENDING: 4, PAYMENT_SUCCESS: 4, SETTLED: 4,
    PROOF_INVALID: -1, CANCELLED: -1,
  };
  return map[state] ?? 0;
}

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTxn = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getTransaction(id);
      setTxn(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTxn();
    const interval = setInterval(fetchTxn, 5000);
    return () => clearInterval(interval);
  }, [fetchTxn]);

  const handleProceedToPayment = async () => {
    if (!txn) return;
    setPaying(true);
    try {
      const orderData = await api.createOrder(txn.id);
      if (orderData._mocked) {
        await api.mockSettle(txn.id);
        await fetchTxn();
        setPaying(false);
        return;
      }
      await openCheckout(
        orderData.orderId, orderData.amount, orderData.keyId,
        async (response: any) => {
          try {
            await api.capturePayment(txn.id, response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
            await fetchTxn();
          } catch (e: any) { setError(e.message); }
          finally { setPaying(false); }
        },
        (err: any) => { setError(`Payment failed: ${err?.error?.description || 'Unknown error'}`); setPaying(false); }
      );
    } catch (err: any) {
      setError(err.message);
      setPaying(false);
    }
  };

  const handleMockSettle = async () => {
    if (!txn) return;
    setSettling(true);
    try {
      await api.mockSettle(txn.id);
      await fetchTxn();
    } catch (err: any) { setError(err.message); }
    finally { setSettling(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>;
  if (!txn) return <div className="bg-red-900/30 border border-red-500 p-6 rounded-xl"><p className="text-red-400">{error || 'Transaction not found'}</p></div>;

  const stepIndex = getStepIndex(txn.state);
  const amountFormatted = txn.amount_paise ? `Rs.${(txn.amount_paise / 100).toLocaleString('en-IN')}` : '--';
  const isWaiting = ['AWAITING_CREDENTIAL','PROOF_GENERATING','VERIFYING','SUPPLIER_SELECTED','POLICY_CREATED'].includes(txn.state);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm text-gray-400">{txn.id}</span>
            <StateBadge state={txn.state as any} />
          </h1>
          {txn.description && <p className="text-gray-400 mt-1">{txn.description}</p>}
          {txn.order_nonce && <p className="text-gray-500 text-xs mt-1">Order: {txn.order_nonce}</p>}
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div className="text-sm text-gray-400">Amount</div>
          <div className="text-3xl font-bold font-mono">{amountFormatted}</div>
          <button onClick={fetchTxn} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Refresh</button>
        </div>
      </div>

      <div className="bg-secondary p-6 rounded-xl border border-muted">
        <h3 className="text-sm font-medium text-gray-400 mb-6 uppercase tracking-wider">Progress</h3>
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent rounded-full transition-all duration-500" style={{ width: `${(Math.max(0,stepIndex) / 4) * 100}%` }} />
          {['Initiated','Policy Set','ZK Proof','Verified','Settled'].map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= stepIndex ? 'bg-accent text-white' : 'bg-muted text-gray-400'}`}>{i < stepIndex ? 'check' : i + 1}</div>
              <span className={`text-xs whitespace-nowrap ${i <= stepIndex ? 'text-white' : 'text-gray-500'}`}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-900/30 border border-red-500 p-4 rounded-xl text-red-300 text-sm">{error}</div>}

      {isWaiting && (
        <div className="bg-secondary p-6 rounded-xl border border-yellow-500/40 border-l-4">
          <div className="flex items-center gap-3 text-yellow-400 mb-2"><Loader2 className="w-5 h-5 animate-spin" /><h2 className="text-lg font-semibold text-white">Waiting for Supplier ZK Proof</h2></div>
          <p className="text-gray-400 text-sm">The supplier must open their dashboard and generate a Zero-Knowledge proof. Auto-refreshing every 5s...</p>
        </div>
      )}

      {txn.state === 'AUTHORIZED' && (
        <div className="bg-secondary p-6 rounded-xl border border-accent border-l-4">
          <h2 className="text-xl font-semibold mb-2">Ready for Payment</h2>
          <p className="text-gray-400 mb-6 text-sm">ZK proof verified. Supplier meets the financial threshold. Amount: <strong>{amountFormatted}</strong></p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleProceedToPayment} disabled={paying} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2">
              {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              {paying ? 'Processing...' : 'Proceed to Checkout'}
            </button>
            <button onClick={handleMockSettle} disabled={settling} className="px-4 py-3 bg-muted hover:bg-gray-700 text-gray-300 rounded-lg text-sm flex items-center gap-2">
              {settling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}[Dev] Mock Settle
            </button>
          </div>
        </div>
      )}

      {txn.state === 'PAYMENT_PENDING' && (
        <div className="bg-secondary p-6 rounded-xl border border-blue-500/40 border-l-4">
          <div className="flex items-center gap-3 text-blue-400 mb-2"><Loader2 className="w-5 h-5 animate-spin" /><h2 className="text-lg font-semibold text-white">Payment Processing...</h2></div>
        </div>
      )}

      {['PAYMENT_SUCCESS','SETTLED'].includes(txn.state) && (
        <div className="bg-secondary p-6 rounded-xl border border-green-500 border-l-4">
          <div className="flex items-center gap-3 text-green-400 mb-2"><CheckCircle2 className="w-6 h-6" /><h2 className="text-xl font-semibold text-white">Payment Settled</h2></div>
          <p className="text-gray-400 text-sm">Transaction complete. Supplier balance remains PRIVATE.</p>
        </div>
      )}

      {['PROOF_INVALID','POLICY_FAILED','CANCELLED'].includes(txn.state) && (
        <div className="bg-secondary p-6 rounded-xl border border-red-500 border-l-4">
          <div className="flex items-center gap-3 text-red-400 mb-2"><AlertTriangle className="w-6 h-6" /><h2 className="text-xl font-semibold text-white">Verification Failed</h2></div>
          <p className="text-gray-400 text-sm">The ZK proof is invalid or the supplier does not meet requirements.</p>
        </div>
      )}
    </div>
  );
}
