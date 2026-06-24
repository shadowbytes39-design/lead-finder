import { createClient } from '@supabase/supabase-js';

// Use a dummy URL if the env vars are missing so the app doesn't crash on import.
// Our components check for process.env.NEXT_PUBLIC_SUPABASE_URL before making actual calls.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  }
});

// Helper for AI Lead Scoring (100-point system)
export const generateLeadScore = (budget: string, intent: string, location: string) => {
  let scoreValue = 0;
  let explanationParts = [];

  // 1. Budget Weight (Max 40)
  if (budget === "3cr_plus") { scoreValue += 40; explanationParts.push("Ultra-high budget"); }
  else if (budget === "1cr_3cr") { scoreValue += 30; explanationParts.push("High budget"); }
  else if (budget === "50l_1cr") { scoreValue += 20; explanationParts.push("Mid budget"); }
  else { scoreValue += 10; explanationParts.push("Low budget"); }

  // 2. Intent Weight (Max 40)
  if (intent === "sell") { scoreValue += 40; explanationParts.push("High-value seller intent"); }
  else { scoreValue += 30; explanationParts.push("Active buyer intent"); }

  // 3. Location Weight (Max 20)
  if (location && location.length > 3) { scoreValue += 20; explanationParts.push("Specific location targeted"); }
  else { scoreValue += 5; explanationParts.push("Broad/vague location"); }

  // Determine Label
  let scoreLabel: "HOT" | "WARM" | "COLD" = "COLD";
  if (scoreValue >= 80) scoreLabel = "HOT";
  else if (scoreValue >= 50) scoreLabel = "WARM";

  return {
    score: scoreLabel,
    score_value: scoreValue,
    ai_explanation: explanationParts.join(" + ")
  };
};
