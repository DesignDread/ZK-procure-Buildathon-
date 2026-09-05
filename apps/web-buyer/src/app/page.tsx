import Link from "next/link";
import { Plus } from "lucide-react";
import StateBadge from "@/components/StateBadge";

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link 
          href="/chat"
          className="flex items-center gap-2 bg-accent hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Start New Procurement
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Active Transactions", value: "12", color: "text-blue-400" },
          { label: "Verified Suppliers", value: "48", color: "text-green-400" },
          { label: "Pending Proofs", value: "5", color: "text-yellow-400" },
          { label: "Completed Payments", value: "156", color: "text-purple-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-secondary p-6 rounded-xl border border-muted">
            <div className="text-sm text-gray-400 mb-2">{stat.label}</div>
            <div className={`text-4xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-secondary border border-muted rounded-xl overflow-hidden">
        <div className="p-6 border-b border-muted">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-muted">
          {[
            { id: "TXN-8472", supplier: "TechCorp India", amount: "₹45,00,000", state: "AUTHORIZED" },
            { id: "TXN-8471", supplier: "Global Logistics", amount: "₹12,50,000", state: "AWAITING_CREDENTIAL" },
            { id: "TXN-8470", supplier: "SecureSystems", amount: "₹8,00,000", state: "SETTLED" },
            { id: "TXN-8469", supplier: "Innovate Manufacturing", amount: "₹1,20,00,000", state: "PROOF_INVALID" },
          ].map((txn, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex flex-col">
                <Link href={`/transactions/${txn.id}`} className="font-medium text-accent hover:underline">
                  {txn.id}
                </Link>
                <span className="text-sm text-gray-400">{txn.supplier}</span>
              </div>
              <div className="flex items-center gap-8">
                <span className="font-mono">{txn.amount}</span>
                <div className="w-32 flex justify-end">
                  <StateBadge state={txn.state as any} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
