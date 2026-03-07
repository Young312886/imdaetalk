-- 집스텝(ZipStep) Supabase DB 스키마
-- 실행 위치: Supabase Dashboard → SQL Editor

-- ─── 1. profiles 테이블 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                 uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name               text,
  age                int CHECK (age BETWEEN 1 AND 120),
  region             text,
  no_house_years     int CHECK (no_house_years >= 0),
  subscription_count int CHECK (subscription_count >= 0),
  monthly_income     int CHECK (monthly_income >= 0),
  email              text,
  alert_enabled      boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- 신규 유저 가입 시 자동으로 profiles 행 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── 2. notices 테이블 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notices (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title                text NOT NULL,
  region               text,
  district             text,
  type                 text,   -- 행복주택 / 국민임대 / 공공분양 / 장기전세 / 청년안심주택
  deposit              bigint,
  rent_fee             int,
  area_sqm             numeric,
  current_market_price bigint,
  expected_profit_10y  bigint,
  conversion_price     bigint,
  source_url           text,
  published_at         date,
  subscription_open    date,
  subscription_close   date,
  winner_announce      date,
  contract_date        date,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ─── 3. notice_ai_summary 테이블 ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.notice_ai_summary (
  notice_id             uuid PRIMARY KEY REFERENCES public.notices ON DELETE CASCADE,
  summary_line1         text,
  summary_line2         text,
  summary_line3         text,
  eligibility_checklist jsonb DEFAULT '[]'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ─── 4. subscriptions 테이블 ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES public.profiles ON DELETE CASCADE,
  notice_id  uuid NOT NULL REFERENCES public.notices ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, notice_id)
);

-- ─── 5. Row Level Security (RLS) ──────────────────────────────

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- notices (전체 공개 읽기)
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices_select_all" ON public.notices
  FOR SELECT USING (true);

-- notice_ai_summary (전체 공개 읽기)
ALTER TABLE public.notice_ai_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_summary_select_all" ON public.notice_ai_summary
  FOR SELECT USING (true);

-- subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_delete_own" ON public.subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- ─── 6. 인덱스 ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notices_region ON public.notices (region);
CREATE INDEX IF NOT EXISTS idx_notices_published ON public.notices (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_subscription_close ON public.notices (subscription_close);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions (user_id);
