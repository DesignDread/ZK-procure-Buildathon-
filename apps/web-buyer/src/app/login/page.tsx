"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("buyer@zkprocure.com");
  const [password, setPassword] = useState("password");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("token", "dummy-jwt-token");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-secondary p-8 rounded-2xl border border-muted shadow-xl">
        <div className="flex justify-center mb-6">
          <ShieldCheck className="w-16 h-16 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-8">ZK-Procure Buyer Login</h1>
        
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
            className="w-full bg-accent hover:bg-blue-600 text-white font-medium py-2.5 rounded-lg transition-colors mt-6"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
