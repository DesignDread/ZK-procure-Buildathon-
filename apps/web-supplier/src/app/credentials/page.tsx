import { AlertTriangle, Key } from "lucide-react";

export default function CredentialsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Verifiable Credentials</h1>
        <button className="bg-accent hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Request New Credential
        </button>
      </div>

      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-red-400 mb-1">⚠️ PRIVATE DATA — LOCAL VIEW ONLY</h3>
          <p className="text-sm text-gray-300">
            This data (such as actual revenue numbers) is shown only here for your reference. It is NEVER sent to the buyer or stored on our servers. Only a zero-knowledge proof of threshold satisfaction is shared during procurement.
          </p>
        </div>
      </div>

      <div className="bg-secondary border border-muted rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <Key className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Financial Health Credential</h2>
              <p className="text-sm text-gray-400">Issued by HDFC Bank (Mock FIP)</p>
            </div>
          </div>
          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium border border-green-500/30">
            ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 bg-background/50 p-4 rounded-lg border border-muted">
          <div>
            <div className="text-sm text-gray-400 mb-1">Annual Revenue (FY23-24)</div>
            <div className="text-2xl font-mono text-red-400">₹12,45,00,000</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Net Profit Margin</div>
            <div className="text-2xl font-mono text-red-400">18.5%</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Issue Date</div>
            <div className="font-mono">2023-10-01</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Valid Until</div>
            <div className="font-mono">2024-09-30</div>
          </div>
        </div>
      </div>
    </div>
  );
}
