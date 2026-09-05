import { Code, Check, AlertCircle } from "lucide-react";

export default function AgentTrace({ traces }: { traces: any[] }) {
  if (!traces || traces.length === 0) {
    return <div className="text-sm text-gray-500 text-center mt-10">No agent activity yet.</div>;
  }

  return (
    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
      {traces.map((trace, i) => (
        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-muted bg-secondary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
            {trace.status === 'success' ? <Check className="w-4 h-4 text-green-400" /> : <Code className="w-4 h-4 text-blue-400" />}
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-muted bg-muted/20 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="font-mono text-xs font-bold text-accent">{trace.name}</div>
            </div>
            <div className="text-xs text-gray-400 font-mono break-all bg-background/50 p-2 rounded">
              {JSON.stringify(trace.args)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
