import { PendingRequestsList } from "../components/PendingRequestsList";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Supplier Dashboard (ABC Industrial)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Active Credentials", value: "2", color: "text-green-400" },
          { label: "Pending Proof Requests", value: "Live", color: "text-yellow-400" },
          { label: "Completed Proofs", value: "24", color: "text-blue-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-secondary p-6 rounded-xl border border-muted">
            <div className="text-sm text-gray-400 mb-2">{stat.label}</div>
            <div className={`text-4xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-secondary border border-muted rounded-xl overflow-hidden">
        <div className="p-6 border-b border-muted">
          <h2 className="text-xl font-semibold">Live Pending Proof Requests</h2>
          <p className="text-sm text-gray-400 mt-1">These are fetched directly from the database based on your chat!</p>
        </div>
        
        <PendingRequestsList />
      </div>
    </div>
  );
}
