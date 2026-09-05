import { CheckCircle2, XCircle, Clock } from "lucide-react";

export default function VerificationTrace() {
  const checks = [
    { name: "Issuer Signature Valid", status: "success", detail: "Signature matches known RBI/Bank public key." },
    { name: "Policy Hash Matches", status: "success", detail: "Proof verified against agreed policy hash." },
    { name: "Identity Binding", status: "success", detail: "Supplier DID matches credential subject." },
    { name: "Nonce Freshness", status: "success", detail: "Order nonce included to prevent replay attacks." },
    { name: "Credential Validity", status: "success", detail: "Credential is not expired or revoked." },
    { name: "Groth16 ZK Proof", status: "success", detail: "Math verification passed. Financial threshold condition met without revealing underlying data." }
  ];

  return (
    <div className="space-y-4">
      {checks.map((check, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-muted/50">
          <div className="mt-0.5">
            {check.status === "success" && <CheckCircle2 className="w-5 h-5 text-green-400" />}
            {check.status === "error" && <XCircle className="w-5 h-5 text-red-400" />}
            {check.status === "pending" && <Clock className="w-5 h-5 text-yellow-400" />}
          </div>
          <div>
            <div className="font-medium text-sm">{check.name}</div>
            <div className="text-xs text-gray-400 mt-1">{check.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
