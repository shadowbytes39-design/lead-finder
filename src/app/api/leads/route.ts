import { NextResponse } from 'next/server';
import { supabase, generateLeadScore } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, intent, location, budget } = body;

    if (!name || !phone || !intent || !location || !budget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Generate AI Score & Explanation securely on the server
    const aiData = generateLeadScore(budget, intent, location);

    // 2. Insert into Database (Unique constraint on phone will catch duplicates)
    const { data, error } = await supabase.from('leads').insert([
      {
        name,
        phone,
        intent: intent === "buy" ? "Buy" : "Sell",
        location,
        budget,
        score: aiData.score,
        score_value: aiData.score_value,
        ai_explanation: aiData.ai_explanation,
        is_verified: true, // Assuming OTP was successful in UI
        is_test: false // Can be flagged from UI for testing
      }
    ]);

    if (error) {
      if (error.code === '23505') { // Postgres Unique Violation
        return NextResponse.json({ error: 'A lead with this phone number already exists.' }, { status: 409 });
      }
      console.error("Supabase Insert Error:", error);
      return NextResponse.json({ error: 'Database error while saving lead.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead: data });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
