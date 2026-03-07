'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Save, Loader2, Check } from 'lucide-react'

type ProfileFormData = {
  age: number | ''
  region: string
  no_house_years: number | ''
  subscription_count: number | ''
  monthly_income: number | ''
}

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

export function ProfileForm({ initialData }: { initialData: Partial<ProfileFormData> }) {
  const [form, setForm] = useState<ProfileFormData>({
    age: initialData.age ?? '',
    region: initialData.region ?? '',
    no_house_years: initialData.no_house_years ?? '',
    subscription_count: initialData.subscription_count ?? '',
    monthly_income: initialData.monthly_income ?? '',
  })
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  async function handleSave() {
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        age: form.age === '' ? null : Number(form.age),
        region: form.region || null,
        no_house_years: form.no_house_years === '' ? null : Number(form.no_house_years),
        subscription_count: form.subscription_count === '' ? null : Number(form.subscription_count),
        monthly_income: form.monthly_income === '' ? null : Number(form.monthly_income),
      }, { onConflict: 'id' })

      if (!error) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  const field = (
    label: string,
    key: keyof ProfileFormData,
    unit: string,
    placeholder: string,
    type: 'number' | 'text' = 'number'
  ) => (
    <div>
      <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {type === 'number' ? (
          <input
            type="number"
            value={form[key]}
            onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value === '' ? '' : Number(e.target.value) }))}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00D09E]/40 focus:border-[#00D09E] transition-all pr-12"
          />
        ) : (
          <select
            value={form[key] as string}
            onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00D09E]/40 focus:border-[#00D09E] transition-all appearance-none"
          >
            <option value="">선택하세요</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {field('나이', 'age', '세', '만 나이 입력')}
      <div>
        <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
          거주 지역
        </label>
        <select
          value={form.region}
          onChange={(e) => setForm(prev => ({ ...prev, region: e.target.value }))}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00D09E]/40 focus:border-[#00D09E] transition-all"
        >
          <option value="">선택하세요</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      {field('무주택 기간', 'no_house_years', '년', '무주택 기간 입력')}
      {field('청약통장 납입 횟수', 'subscription_count', '회', '납입 횟수 입력')}
      {field('월 소득', 'monthly_income', '만원', '세전 월 소득 입력')}

      <button
        onClick={handleSave}
        disabled={isPending}
        id="save-profile-btn"
        className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-extrabold transition-all active:scale-[0.98] ${
          saved
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
            : 'bg-[#00D09E] text-white shadow-lg shadow-[#00D09E]/30 hover:bg-[#00b388]'
        }`}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : saved ? (
          <><Check className="h-5 w-5" /> 저장됐어요! 이제 맞춤 공고만 골라드릴게요 🎯</>
        ) : (
          <><Save className="h-4 w-4" /> 내 조건 저장하기</>
        )}
      </button>
    </div>
  )
}
