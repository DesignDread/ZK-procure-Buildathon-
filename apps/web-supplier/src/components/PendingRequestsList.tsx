"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";

export function PendingRequestsList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:3001/api/suppliers/pending-requests");
      const data = await res.json();
      if (Array.isArray(data)) {
        setRequests(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Poll every 3 seconds so you can see it appear live when chatbot creates it!
    const interval = setInterval(fetchRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-6 text-gray-400">Loading live requests...</div>;

  if (requests.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center">
        <Inbox className="w-12 h-12 mb-3 opacity-20" />
        <p>No pending proof requests found.</p>
        <p className="text-sm mt-1">Ask the chatbot to create a transaction to see it appear here!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-muted">
      {requests.map((req, i) => (
        <div key={i} className="p-6 flex items-center justify-between hover:bg-muted/10 transition-colors">
          <div>
            <h3 className="font-semibold text-lg text-yellow-400 mb-1">Compliance Proof Required</h3>
            <p className="text-sm text-gray-400">Transaction ID: {req.transaction_id}</p>
            <p className="text-sm text-gray-400 mt-1">Policy Enforced: <span className="text-white font-mono">{req.policy_hash ? req.policy_hash.substring(0, 16) + '...' : 'N/A'}</span></p>
          </div>
          <Link href={`/proofs/${req.id}`} className="bg-accent hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
            Generate ZK Proof <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ))}
    </div>
  );
}
