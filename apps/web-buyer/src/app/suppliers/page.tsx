import { CheckCircle2, XCircle } from "lucide-react";

export default function SuppliersPage() {
  const suppliers = [
    { name: "TechCorp India", gstin: "29ABCDE1234F1Z5", gstValid: true, verified: true },
    { name: "Global Logistics", gstin: "27QWERT9876A1Z3", gstValid: true, verified: false },
    { name: "SecureSystems", gstin: "07ZXCVB4567M1Z1", gstValid: true, verified: true },
    { name: "Innovate Manufacturing", gstin: "33POIUY8765L1Z9", gstValid: false, verified: false },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Discover Suppliers</h1>
      </div>

      {/* Filter Bar */}
      <div className="bg-secondary p-4 rounded-lg border border-muted flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="form-checkbox text-accent bg-background border-muted rounded" defaultChecked />
          <span>GST Valid</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="form-checkbox text-accent bg-background border-muted rounded" defaultChecked />
          <span>Verified Credential Available</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {suppliers.map((sup, i) => (
          <div key={i} className="bg-secondary border border-muted rounded-xl p-6 flex flex-col h-full">
            <h3 className="text-xl font-semibold mb-1">{sup.name}</h3>
            <p className="text-sm text-gray-400 font-mono mb-4">GSTIN: {sup.gstin}</p>
            
            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span>GST Validation</span>
                {sup.gstValid ? (
                  <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-4 h-4" /> Valid</span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400"><XCircle className="w-4 h-4" /> Invalid</span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Financial Verifiable</span>
                {sup.verified ? (
                  <span className="flex items-center gap-1 text-green-400"><CheckCircle2 className="w-4 h-4" /> Yes</span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400"><XCircle className="w-4 h-4" /> No</span>
                )}
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-xs text-gray-400 border border-muted">
                Financial numbers are strictly confidential and will only be evaluated via ZK proofs during transactions.
              </div>
            </div>

            <button className="w-full bg-accent hover:bg-blue-600 text-white py-2 rounded-lg transition-colors font-medium">
              Select for Procurement
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
