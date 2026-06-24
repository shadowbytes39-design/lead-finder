"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Home, MapPin, IndianRupee, Phone, User, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { supabase, generateLeadScore } from "@/lib/supabase";

export default function LandingPage() {

  const [intent, setIntent] = useState<"buy" | "sell">("buy");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    budget: "50l_1cr",
    propertyType: "Residential Flat"
  });

  const handleSendOtp = () => {
    setIsOtpSent(true);
  };

  const handleVerifyOtp = () => {
    setIsVerified(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) return;
    
    setIsLoading(true);

    try {
      // If Supabase URL is not set (e.g. local testing before account creation), this will fail gracefully or we can mock it.
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Send to secure API instead of direct insert
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            phone: formData.phone,
            intent: intent,
            propertyType: formData.propertyType,
            location: formData.location,
            budget: formData.budget
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to save lead');
        }
      } else {
        // Mock fallback for local testing without DB
        console.log("Mock lead saved:", { ...formData, intent, is_verified: true });
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      setIsSubmitted(true);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold tracking-tight">Intent<span className="text-primary">Network</span></span>
          </div>
          <Link 
            href="/login" 
            className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
          >
            Agent Portal →
          </Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 grid lg:grid-cols-2 gap-16 items-center">
        
        {/* Left Column: Copywriting */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium text-primary">
            <ShieldCheck className="w-4 h-4" /> Trusted by 10,000+ Verified Buyers
          </div>
          
          <h1 className="text-6xl sm:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Find Your Dream Home. <br />
            <span className="text-gradient">Without the Hassle.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
            Tell us what you're looking for, and our AI matches you with the top 1% of verified real estate agents in your city instantly.
          </p>

          <div className="grid grid-cols-2 gap-6 pt-8">
            {[
              { label: "100% Free", sub: "No hidden charges" },
              { label: "Spam Free", sub: "Your number is safe" },
              { label: "Top Agents", sub: "Only verified brokers" },
              { label: "Fast Matching", sub: "Get calls in 5 mins" },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  {feature.label}
                </div>
                <div className="text-sm text-muted-foreground pl-7">{feature.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Lead Form */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* Decorative glow behind form */}
          <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-[3rem]" />
          
          <div className="relative glass-card p-8 sm:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center text-center py-16 space-y-6">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-3xl font-bold">Request Received!</h3>
                <p className="text-muted-foreground">
                  Our system is analyzing your requirements. Top local agents will contact you shortly.
                </p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Submit another request
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">What's your goal?</h2>
                  <div className="flex bg-black/50 p-1 rounded-full border border-white/10">
                    <button 
                      type="button"
                      onClick={() => setIntent("buy")}
                      className={cn(
                        "px-6 py-2 rounded-full text-sm font-semibold transition-all",
                        intent === "buy" ? "bg-primary text-black shadow-lg" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      Buy
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIntent("sell")}
                      className={cn(
                        "px-6 py-2 rounded-full text-sm font-semibold transition-all",
                        intent === "sell" ? "bg-primary text-black shadow-lg" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      Sell
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80 pl-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input 
                          required 
                          type="text" 
                          placeholder="John Doe" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80 pl-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                        <input 
                          required 
                          type="tel" 
                          placeholder="+91 9876543210" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" 
                        />
                      </div>
                    </div>
                  </div>

              {/* Location & Property Type Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Preferred Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Bandra West, Mumbai"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Property Type</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <select
                      value={formData.propertyType}
                      onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                      className="w-full bg-[#18181b] border border-white/10 rounded-xl px-10 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                    >
                      <option value="Residential Flat">Residential Flat</option>
                      <option value="Independent House / Villa">Independent House / Villa</option>
                      <option value="Plot / Land">Plot / Land</option>
                      <option value="Commercial Space">Commercial Space</option>
                      <option value="Farmhouse">Farmhouse</option>
                    </select>
                  </div>
                </div>
              </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80 pl-1">Estimated Budget</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                      <select 
                        required 
                        value={formData.budget}
                        onChange={(e) => setFormData({...formData, budget: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all appearance-none"
                      >
                        <option value="" disabled>Select Budget Range</option>
                        <option value="under_50l">Under ₹50 Lacs</option>
                        <option value="50l_1cr">₹50 Lacs - ₹1 Cr</option>
                        <option value="1cr_3cr">₹1 Cr - ₹3 Cr</option>
                        <option value="3cr_plus">₹3 Cr+</option>
                      </select>
                    </div>
                  </div>

                  {/* OTP Verification Block */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-white/80 font-medium">Verify your number</span>
                      {isVerified && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Verified</span>}
                    </div>
                    {!isVerified && !isOtpSent && (
                      <button type="button" onClick={handleSendOtp} className="w-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm py-3 rounded-xl transition-all">
                        Send OTP via SMS
                      </button>
                    )}
                    {isOtpSent && !isVerified && (
                      <div className="flex gap-2">
                        <input type="text" placeholder="1234" maxLength={4} className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white text-center tracking-widest focus:outline-none focus:border-primary/50 transition-all" />
                        <button type="button" onClick={handleVerifyOtp} className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-xl transition-all">Verify</button>
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit"
                    disabled={!isVerified || isLoading}
                    className="w-full bg-primary text-black font-bold text-lg py-4 rounded-2xl mt-4 hover:bg-primary/90 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Analyzing Lead..." : isVerified ? "Get Matched Now" : "Complete Verification First"}
                    {!isLoading && isVerified && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  </button>
                  <p className="text-center text-xs text-white/40 mt-4">
                    By submitting, you agree to our terms of service and privacy policy.
                  </p>
                </form>
              </>
            )}
          </div>
        </motion.div>

      </main>
    </div>
  );
}
