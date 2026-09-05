import { Terminal, User, Bot, Webhook } from "lucide-react";

export default function AuditTrail() {
  const events = [
    { type: 'human', action: 'Procurement Initiated', time: '10:00 AM' },
    { type: 'agent', action: 'Supplier Selected: TechCorp India', time: '10:01 AM' },
    { type: 'system', action: 'Policy Generated (Hash: 0x9f8...3b2)', time: '10:01 AM' },
    { type: 'system', action: 'Awaiting Supplier Proof', time: '10:02 AM' },
    { type: 'webhook', action: 'Proof Received from Supplier', time: '10:15 AM' },
    { type: 'system', action: 'Groth16 Verification Passed', time: '10:15 AM' },
    { type: 'system', action: 'State Updated to AUTHORIZED', time: '10:15 AM' },
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case 'human': return <User className="w-4 h-4 text-blue-400" />;
      case 'agent': return <Bot className="w-4 h-4 text-purple-400" />;
      case 'webhook': return <Webhook className="w-4 h-4 text-yellow-400" />;
      default: return <Terminal className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {events.map((ev, i) => (
        <div key={i} className="flex gap-4">
          <div className="mt-1 bg-muted p-1.5 rounded-full">
            {getIcon(ev.type)}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{ev.action}</div>
            <div className="text-xs text-gray-500">{ev.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
