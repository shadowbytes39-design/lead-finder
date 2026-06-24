"use client";

import { useState, useEffect } from "react";
import { Building2, Coins, Search, Lock, Unlock, Zap, Thermometer, MapPin, IndianRupee, Bell, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Mock Data
type Lead = {
  id: string;
  name_masked: string;
  phone_masked: string;
  intent: "Buy" | "Sell";
  property_type: string;
  location: string;
  budget: string;
  score: "HOT" | "WARM" | "COLD";
  score_value: number;
  ai_explanation: string;
  is_unlocked: boolean;
  time: string;
};

const INITIAL_LEADS: Lead[] = [
  { id: "mock1", name_masked: "R**** S****", phone_masked: "+91 98*** *****", intent: "Buy", location: "Andheri West, Mumbai", budget: "₹1 Cr - ₹3 Cr", score: "HOT", score_value: 85, ai_explanation: "High budget + Active buyer", is_unlocked: false, time: "10 mins ago" },
  { id: "mock2", name_masked: "S**** D****", phone_masked: "+91 99*** *****", intent: "Sell", location: "Powai, Mumbai", budget: "₹3 Cr+", score: "WARM", score_value: 65, ai_explanation: "High budget seller + Low urgency", is_unlocked: false, time: "1 hour ago" },
];

export default function Dashboard() {
  const [credits, setCredits] = useState(150);
  const [unlockedLeads, setUnlockedLeads] = useState<Set<string>>(new Set());
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let channel: any;

    const fetchLeads = async () => {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://dummy.supabase.co') {
        // Fetch Real Credits
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          const { data: agentData } = await supabase.from('agents').select('credits').eq('id', authData.user.id).single();
          if (agentData) {
            setCredits(agentData.credits);
          } else {
            setCredits(0); // No agent profile exists yet
          }
        }

        // Fetch Leads
        const { data, error } = await supabase.from('marketplace_leads').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          const formattedLeads = data.map((d: any) => ({
            id: d.id,
            name_masked: d.name_masked,
            phone_masked: d.phone_masked,
            intent: d.intent,
            property_type: d.property_type || 'Residential',
            location: d.location,
            budget: d.budget.replace(/_/g, ' ').toUpperCase(),
            score: d.score,
            score_value: d.score_value,
            ai_explanation: d.ai_explanation,
            is_unlocked: d.is_unlocked,
            time: "Just now"
          }));
          setLeads(formattedLeads);
        }

        // Setup Realtime Subscription
        channel = supabase.channel('schema-db-changes')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'leads' },
            (payload) => {
              // Fetch the newly processed view row to get masked data
              supabase.from('marketplace_leads').select('*').eq('id', payload.new.id).single()
                .then(({data: newLead}) => {
                  if (newLead) {
                    setLeads(prev => [{
                      id: newLead.id,
                      name_masked: newLead.name_masked,
                      phone_masked: newLead.phone_masked,
                      intent: newLead.intent,
                      property_type: newLead.property_type || 'Residential',
                      location: newLead.location,
                      budget: newLead.budget.replace(/_/g, ' ').toUpperCase(),
                      score: newLead.score,
                      score_value: newLead.score_value,
                      ai_explanation: newLead.ai_explanation,
                      is_unlocked: newLead.is_unlocked,
                      time: "Just now"
                    }, ...prev]);
                  }
                });
            }
          )
          .subscribe();

      }
      setIsLoading(false);
    };
    fetchLeads();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handleUnlock = async (leadId: string) => {
    if (credits < 10) {
      alert("Not enough credits! Please recharge.");
      return;
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://dummy.supabase.co') {
      const { data, error } = await supabase.rpc('secure_unlock_lead', { p_lead_id: leadId });
      
      if (error || !data?.success) {
        alert(data?.error || error?.message || "Failed to unlock lead.");
        return;
      }
      
      // Re-fetch the specific lead to get unmasked data
      const { data: updatedLead } = await supabase.from('marketplace_leads').select('*').eq('id', leadId).single();
      if (updatedLead) {
        setLeads(prev => prev.map(l => l.id === leadId ? {
          ...l, 
          name_masked: updatedLead.name_masked,
          phone_masked: updatedLead.phone_masked,
          is_unlocked: true
        } : l));
        setCredits(prev => prev - 10);
      }
    } else {
      // Local Mock fallback
      setCredits(prev => prev - 10);
      setLeads(prev => prev.map(l => l.id === leadId ? {...l, is_unlocked: true, name_masked: "Rahul Sharma", phone_masked: "+91 98765 43210"} : l));
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-white/10 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-bold tracking-tight">PropLeads<span className="text-primary">.ai</span> / Agent</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <button className="relative text-muted-foreground hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#09090b]" />
            </button>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">{credits} Credits</span>
              <button className="ml-2 text-xs font-bold text-black bg-primary px-2 py-0.5 rounded-full hover:bg-primary/90 transition-colors">
                Recharge
              </button>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 border border-white/20" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Verified Intent Network</h1>
            <p className="text-muted-foreground mt-1">Unlock highly qualified, OTP-verified buyers and sellers in your area.</p>
          </div>
          
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Search locations..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              3 new leads added in the last hour
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-sm font-medium text-white/60">
                <th className="p-4 whitespace-nowrap">Intent</th>
                <th className="p-4 whitespace-nowrap">Location & Budget</th>
                <th className="p-4 whitespace-nowrap">AI Score</th>
                <th className="p-4 whitespace-nowrap">Time</th>
                <th className="p-4 text-right whitespace-nowrap">Contact Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                // Shimmer Loading State
                [1, 2, 3].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="py-6 px-6"><div className="h-6 w-16 bg-white/5 rounded-full" /></td>
                    <td className="py-6 px-6"><div className="h-6 w-48 bg-white/5 rounded-full" /></td>
                    <td className="py-6 px-6"><div className="h-8 w-24 bg-white/5 rounded-full" /></td>
                    <td className="py-6 px-6"><div className="h-4 w-20 bg-white/5 rounded-full" /></td>
                    <td className="py-6 px-6"><div className="h-12 w-32 bg-white/5 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No leads in the marketplace</h3>
                    <p className="text-white/40">Waiting for new buyers/sellers to submit intent...</p>
                  </td>
                </tr>
              ) : leads.map((lead) => {
                const isUnlocked = lead.is_unlocked;
                
                return (
                  <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Intent Column */}
                    <td className="py-6 px-6">
                      <span className={cn(
                        "text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider",
                        lead.intent === "Buy" ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"
                      )}>
                        {lead.intent}
                      </span>
                    </td>
                    {/* Location & Budget */}
                    <td className="py-6 px-6">
                      <div className="flex flex-col gap-1.5">
                        <div className="font-bold text-white flex items-center gap-1.5 text-sm">
                          <MapPin className="w-3.5 h-3.5 text-white/40" /> {lead.location}
                        </div>
                        <div className="text-white/60 font-mono text-sm flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-white/40" /> {lead.property_type}
                        </div>
                        <div className="text-emerald-400 font-mono text-sm flex items-center gap-1.5 bg-emerald-500/10 w-fit px-2 py-0.5 rounded">
                          <IndianRupee className="w-3.5 h-3.5" /> {lead.budget}
                        </div>
                      </div>
                    </td>
                    {/* AI Score Column */}
                    <td className="py-6 px-6 relative group">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "font-bold text-sm tracking-widest px-3 py-1 rounded-full border flex items-center gap-1.5",
                          lead.score === "HOT" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : "",
                          lead.score === "WARM" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "",
                          lead.score === "COLD" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : ""
                        )}>
                          {lead.score === "HOT" && <Zap className="w-3.5 h-3.5" />}
                          {lead.score === "WARM" && <Thermometer className="w-3.5 h-3.5" />}
                          {lead.score}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-white font-mono text-lg font-bold leading-none">{lead.score_value || 50}</span>
                          <span className="text-[10px] text-white/40 uppercase tracking-widest">/100</span>
                        </div>
                      </div>

                      {/* AI Explanation Tooltip */}
                      <div className="absolute top-1/2 -translate-y-1/2 left-32 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-2xl">
                        <p className="text-xs text-white/70 leading-relaxed">
                          {lead.ai_explanation || "Browsing properties, no urgent timeline"}
                        </p>
                        <div className="w-full bg-black/50 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${lead.score_value || 50}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-top text-sm text-white/40 whitespace-nowrap">
                      {lead.time}
                    </td>
                    {/* Contact Details (Unlockable) */}
                    <td className="py-6 px-6 text-right">
                      {isUnlocked ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-white">{lead.name_masked} <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" /></span>
                          <span className="text-primary font-mono">{lead.phone_masked}</span>
                          <span className="text-[10px] text-emerald-400/80 uppercase tracking-wider flex items-center gap-1 mt-1">
                            <Unlock className="w-3 h-3" /> UNLOCKED
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex flex-col items-end opacity-20 select-none pointer-events-none blur-sm">
                            <span className="font-bold">{lead.name_masked}</span>
                            <span className="font-mono text-sm">{lead.phone_masked}</span>
                          </div>
                          <button 
                            onClick={() => handleUnlock(lead.id)}
                            className="bg-primary/90 hover:bg-primary text-black font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,204,0,0.2)]"
                          >
                            <Lock className="w-4 h-4" /> Unlock <span className="bg-black/10 px-2 py-0.5 rounded-md text-xs">10 Credits</span>
                          </button>
                          <span className="text-[10px] text-white/30">(10 Credits = ~₹200)</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* 450+ Blurred Urgent Leads */}
              {!isLoading && leads.length > 0 && [1, 2, 3].map((n) => (
                <tr key={`dummy-${n}`} className="border-t border-white/5 bg-black/40 opacity-40 hover:opacity-60 transition-opacity select-none">
                  <td className="py-4 px-6">
                    <span className="bg-white/10 text-white/50 text-xs font-bold px-3 py-1.5 rounded-full uppercase">Hidden</span>
                  </td>
                  <td className="py-4 px-6 blur-sm">
                    <div className="font-bold text-white text-sm mb-1"><MapPin className="w-3.5 h-3.5 inline text-white/40" /> Premium Area</div>
                    <div className="text-emerald-400 font-mono text-sm bg-emerald-500/10 w-fit px-2 py-0.5 rounded">₹2 Cr - ₹5 Cr</div>
                  </td>
                  <td className="py-4 px-6 blur-sm">
                    <span className="font-bold text-sm tracking-widest px-3 py-1 rounded-full border bg-orange-500/10 text-orange-400 border-orange-500/20">HOT</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-white/20">2 hrs ago</td>
                  <td className="py-4 px-6 text-right">
                    <button disabled className="bg-white/5 border border-white/10 text-white/30 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 ml-auto">
                      <Lock className="w-4 h-4" /> Locked
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!isLoading && leads.length > 0 && (
            <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
              <span className="text-sm font-medium text-white/50 hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                Upgrade to view 450+ more local leads <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
