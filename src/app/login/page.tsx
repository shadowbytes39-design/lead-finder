"use client";

import { useState } from "react";
import { Building2, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AgentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Real Supabase Auth
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          setErrorMsg(error.message);
          return;
        }
      } else {
        // Mock Auth for Local MVP Testing
        console.log("Mock Agent Login:", email);
        await new Promise(r => setTimeout(r, 800));
        if (email !== "admin@propleads.ai") {
          setErrorMsg("For local testing, use email: admin@propleads.ai");
          return;
        }
      }

      // Success - Redirect to dashboard
      router.push("/dashboard");

    } catch (err: any) {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Building2 className="w-6 h-6 text-primary" />
        <span className="font-bold tracking-tight text-xl">Intent<span className="text-primary">Network</span></span>
      </Link>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Agent Portal Login</h1>
          <p className="text-muted-foreground">Access verified real estate buyer/seller intent.</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6 text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 pl-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input 
                  required 
                  type="email" 
                  placeholder="admin@propleads.ai" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input 
                  required 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" 
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-black font-bold text-lg py-4 rounded-2xl mt-4 hover:bg-primary/90 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? "Authenticating..." : "Sign In to Dashboard"}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-8">
            Don't have an agent account? <br />
            <a href="#" className="text-primary hover:underline">Apply for early access</a>
          </p>
        </div>
      </div>
    </div>
  );
}
