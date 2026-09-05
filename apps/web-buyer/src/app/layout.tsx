import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, LayoutDashboard, PlusCircle, Users, Activity } from "lucide-react";

export const metadata: Metadata = {
  title: "ZK-Procure Buyer Portal",
  description: "Secure procurement platform using Zero-Knowledge Proofs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex h-screen bg-background text-foreground antialiased font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-secondary border-r border-muted flex flex-col">
          <div className="p-6 flex items-center gap-3 border-b border-muted">
            <ShieldCheck className="w-8 h-8 text-accent" />
            <h1 className="text-xl font-bold tracking-tight">ZK-Procure</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
              <LayoutDashboard className="w-5 h-5 text-gray-400" />
              <span>Dashboard</span>
            </Link>
            <Link href="/chat" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
              <PlusCircle className="w-5 h-5 text-gray-400" />
              <span>New Procurement</span>
            </Link>
            <Link href="/suppliers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
              <Users className="w-5 h-5 text-gray-400" />
              <span>Suppliers</span>
            </Link>
            <Link href="/transactions" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors">
              <Activity className="w-5 h-5 text-gray-400" />
              <span>Transactions</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-16 bg-secondary border-b border-muted flex items-center justify-end px-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center font-bold">
                B
              </div>
              <span className="text-sm font-medium">Buyer Admin</span>
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
