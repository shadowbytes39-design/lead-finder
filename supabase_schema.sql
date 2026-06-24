-- PRODUCTION ARCHITECTURE: Intent Network CRM

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------
-- 1. TABLES
-----------------------------------------

-- Table: Leads
DROP TABLE IF EXISTS public.agent_leads CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.unlocks CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.agents CASCADE;

CREATE TABLE public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE, -- Prevents duplicate leads
    intent TEXT NOT NULL CHECK (intent IN ('Buy', 'Sell')),
    location TEXT NOT NULL,
    budget TEXT NOT NULL,
    score TEXT NOT NULL CHECK (score IN ('HOT', 'WARM', 'COLD')),
    score_value INTEGER NOT NULL DEFAULT 0, -- 0 to 100
    ai_explanation TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_test BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Agents
CREATE TABLE public.agents (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    credits INTEGER DEFAULT 0 CHECK (credits >= 0), -- Prevents negative credits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: Agent Leads (Multi-tenant ownership / Unlocks)
CREATE TABLE public.agent_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agent_id, lead_id)
);

-- Table: Credit Transactions (Ledger)
CREATE TABLE public.credit_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('ADD', 'DEDUCT')),
    amount INTEGER NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-----------------------------------------
-- 2. VIEWS (Masking Data)
-----------------------------------------

-- Create a secure view for the marketplace so frontend clients 
-- don't accidentally get real phone numbers via Realtime or raw queries.
CREATE OR REPLACE VIEW public.marketplace_leads AS
SELECT 
    l.id,
    l.intent,
    l.location,
    l.budget,
    l.score,
    l.score_value,
    l.ai_explanation,
    l.created_at,
    l.is_test,
    EXISTS (
        SELECT 1 FROM public.agent_leads al 
        WHERE al.lead_id = l.id AND al.agent_id = auth.uid()
    ) as is_unlocked,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.agent_leads al 
            WHERE al.lead_id = l.id AND al.agent_id = auth.uid()
        ) THEN l.name 
        ELSE SUBSTRING(l.name FROM 1 FOR 1) || '**** ' || SUBSTRING(SPLIT_PART(l.name, ' ', 2) FROM 1 FOR 1) || '****'
    END as name_masked,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.agent_leads al 
            WHERE al.lead_id = l.id AND al.agent_id = auth.uid()
        ) THEN l.phone 
        ELSE '+91 98*** *****'
    END as phone_masked
FROM public.leads l
WHERE l.is_test = false; -- Never show test leads in production marketplace

-----------------------------------------
-- 3. SECURITY (RLS)
-----------------------------------------

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Leads: Anyone can insert (via landing page / backend API). Nobody can select directly.
CREATE POLICY "Allow insert to leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Deny direct select to leads" ON public.leads FOR SELECT USING (false); -- Force use of the View

-- Agents: Can only see their own profile
CREATE POLICY "Agents view own profile" ON public.agents FOR SELECT USING (auth.uid() = id);

-- Agent Leads: Can only see their own unlocked leads
CREATE POLICY "Agents view own unlocks" ON public.agent_leads FOR SELECT USING (auth.uid() = agent_id);

-- Credit Transactions: Can only see their own ledger
CREATE POLICY "Agents view own ledger" ON public.credit_transactions FOR SELECT USING (auth.uid() = agent_id);

-----------------------------------------
-- 4. SECURE FUNCTIONS
-----------------------------------------

-- The core monetization engine. Deducts credits and adds an unlock record atomically.
CREATE OR REPLACE FUNCTION secure_unlock_lead(p_lead_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_agent_credits INTEGER;
    v_agent_id UUID := auth.uid();
    v_result JSONB;
BEGIN
    -- 1. Ensure user is logged in
    IF v_agent_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- 2. Check if already unlocked
    IF EXISTS (SELECT 1 FROM public.agent_leads WHERE agent_id = v_agent_id AND lead_id = p_lead_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already unlocked');
    END IF;

    -- 3. Get current credits
    SELECT credits INTO v_agent_credits FROM public.agents WHERE id = v_agent_id FOR UPDATE;

    -- 4. Verify credits
    IF v_agent_credits >= 10 THEN
        -- Deduct credits
        UPDATE public.agents SET credits = credits - 10 WHERE id = v_agent_id;
        
        -- Insert into Ledger
        INSERT INTO public.credit_transactions (agent_id, type, amount, reason) 
        VALUES (v_agent_id, 'DEDUCT', 10, 'Unlocked Lead ' || p_lead_id);

        -- Record unlock
        INSERT INTO public.agent_leads (agent_id, lead_id) VALUES (v_agent_id, p_lead_id);
        
        RETURN jsonb_build_object('success', true, 'message', 'Lead unlocked successfully');
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
