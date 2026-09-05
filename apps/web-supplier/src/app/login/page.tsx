"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@techcorp.in");
  const [password, setPassword] = useState("password");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("supplier_token", "dummy-jwt-token");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-secondary p-8 rounded-2xl border border-muted shadow-xl">
        <div className="flex justify-center mb-6">
          <Lock className="w-16 h-16 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-8">ZK-Procure Supplier Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-muted rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-muted rounded-lg px-4 py-2 focus:outline-none focus:border-accent"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-accent hover:bg-sky-600 text-white font-medium py-2.5 rounded-lg transition-colors mt-6"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
