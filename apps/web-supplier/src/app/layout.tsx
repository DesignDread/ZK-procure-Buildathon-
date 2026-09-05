import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Lock, LayoutDashboard, KeyRound, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "ZK-Procure Supplier Portal",
  description: "Secure supplier portal for ZK proofs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen bg-background text-foreground antialiased font-sans">
        <aside className="w-64 bg-secondary border-r border-muted flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-muted">
            <Lock className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-bold tracking-tight">ZK-Procure</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
              <LayoutDashboard className="w-5 h-5 text-gray-400" />
              <span>Dashboard</span>
            </Link>
            <Link href="/credentials" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
              <KeyRound className="w-5 h-5 text-gray-400" />
              <span>Credentials</span>
            </Link>
            <Link href="/proofs/1" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
              <ShieldAlert className="w-5 h-5 text-gray-400" />
              <span>Proof Requests</span>
            </Link>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-accent/10 border-b border-accent/20 px-6 py-3 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">SUPPLIER PORTAL — Private data never leaves this application</span>
          </header>
          <header className="h-16 bg-secondary border-b border-muted flex items-center justify-end px-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center font-bold">
                S
              </div>
              <span className="text-sm font-medium">TechCorp India</span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8 bg-background">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
