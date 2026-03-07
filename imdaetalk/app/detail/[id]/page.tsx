import { notFound } from 'next/navigation'
import Link from 'next/link'
import { dummyNotices, formatMoney } from '@/data/dummyNotices'
import { createClient } from '@/utils/supabase/server'
import { BentoBox } from '@/components/ui/BentoBox'
import {
  TrendingUp, CheckCircle2, XCircle, Clock,
  FileText, Bell, MapPin, Calculator, AlertCircle, Lock
} from 'lucide-react'

interface PageProps {
  params: { id: string }
}

const CHECKLIST_ITEMS = [
  { key: 'age', label: '나이 조건 (만 19~39세)', met: true, emoji: '👤' },
  { key: 'noHouse', label: '무주택 세대 구성원', met: true, emoji: '🏠' },
  { key: 'subscription', label: '청약통장 6개월 이상', met: false, emoji: '🏦' },
  { key: 'income', label: '소득 기준 충족', met: true, emoji: '💰' },
  { key: 'region', label: '해당 지역 거주', met: true, emoji: '📍' },
]

export default async function DetailPage({ params }: PageProps) {
  const notice = dummyNotices.find(n => n.id === params.id)
  if (!notice) notFound()

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const isLoggedIn = !!session

  const profitRate = Math.round(
    ((notice.expected_profit) / notice.current_market_price) * 100
  )

  const TIMELINE = [
    { label: '모집공고', date: notice.published_at, done: true },
    { label: '청약 접수', date: `${notice.subscription_open}\n~ ${notice.subscription_close}`, done: false, active: true },
    { label: '당첨 발표', date: notice.winner_announce, done: false },
    { label: '계약', date: notice.contract_date, done: false },
  ]

  return (
    <div className="pb-20 pt-6">

      {/* ── PC에서 2컬럼 레이아웃: 좌측 메인 콘텐츠 / 우측 스티키 사이드패널 */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start">

        {/* ══════════════ 좌측 메인 ══════════════ */}
        <div className="space-y-4">

          {/* 🚀 Hero 섹션 */}
          <div className="rounded-3xl bg-slate-50 border border-slate-100 px-6 pt-8 pb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFD54F]/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00D09E]/10 text-[#00D09E] text-[12px] font-extrabold tracking-tight mb-4 relative z-10">
              <TrendingUp className="h-3.5 w-3.5" />
              가치 성장 리포트
            </div>

            <h1 className="text-[22px] font-bold text-slate-800 leading-tight mb-3 relative z-10">
              당첨되면 10년 뒤 얼마 버는지,<br />
              계산해봤어요 ✨
            </h1>

            <div className="flex items-baseline gap-1 mt-2 mb-2 relative z-10">
              <span className="text-5xl font-black text-gradient-profit tracking-tighter leading-none">
                +{formatMoney(notice.expected_profit)}
              </span>
              <span className="text-lg text-orange-500 font-extrabold pb-1">원</span>
            </div>
            <p className="text-slate-500 text-[13px] font-medium tracking-tight relative z-10">
              현재 주변 시세 대비 +{profitRate}% 상승 여력
            </p>
          </div>

          {/* 공고 기본 정보 */}
          <BentoBox>
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="text-[13px] font-bold text-slate-500">{notice.region} {notice.district}</span>
            </div>
            <h2 className="text-[20px] font-extrabold text-slate-900 leading-snug mb-4">{notice.title}</h2>
            <div className="flex gap-2">
              <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                {notice.type}
              </span>
              <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[12px] font-bold">
                {notice.area_sqm}㎡
              </span>
            </div>
          </BentoBox>

          {/* 🤖 AI 3줄 요약 */}
          <BentoBox>
            <h3 className="flex items-center gap-2 font-bold text-[16px] text-slate-900 mb-4">
              <span>💡</span> AI 핵심 브리핑
            </h3>
            <div className="space-y-3">
              {notice.ai_summary.map((line, i) => (
                <div key={i} className="flex gap-3">
                  <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#00D09E]/15 text-[#00D09E] text-[12px] font-black">
                    {i + 1}
                  </span>
                  <p className="text-[14px] text-slate-700 font-medium leading-relaxed pt-0.5">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </BentoBox>

          {/* 📋 내 가점 체크 */}
          <BentoBox>
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 font-bold text-[16px] text-slate-900">
                <span>🎯</span> 내 가점 체크
              </h3>
              {isLoggedIn && (
                <span className="text-[12px] font-bold text-[#00D09E] bg-[#00D09E]/10 px-2.5 py-1 rounded-full">
                  4 / 5 충족
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {CHECKLIST_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.emoji}</span>
                    <span className="text-[14px] font-bold text-slate-700">{item.label}</span>
                  </div>
                  {isLoggedIn ? (
                    item.met ? (
                      <CheckCircle2 className="h-5 w-5 text-[#00D09E]" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-rose-500" />
                    )
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                      <Lock className="h-3 w-3 text-slate-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {isLoggedIn ? (
              <div className="mt-3.5 rounded-xl bg-slate-50 border border-slate-200 p-3 text-[12px] font-medium text-slate-500 flex items-start gap-1.5">
                <span className="text-base leading-none">⚠️</span>
                일부 조건이 맞지 않아요. (청약통장 기간 부족)
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-gradient-to-r from-[#00D09E]/10 to-[#00b388]/10 border border-[#00D09E]/20 p-4 text-center">
                <p className="text-[13px] font-bold text-slate-800 mb-2">내 조건에 맞는지 궁금하신가요?</p>
                <Link
                  href="/auth/login"
                  className="inline-block w-full rounded-lg bg-[#00D09E] text-white py-2.5 text-[13px] font-extrabold shadow-md shadow-[#00D09E]/30 transition-transform active:scale-95"
                >
                  1초 만에 가점 확인하기
                </Link>
              </div>
            )}
          </BentoBox>

          {/* 📅 청약 일정표 */}
          <BentoBox>
            <h3 className="flex items-center gap-2 font-bold text-[16px] text-slate-900 mb-6">
              <span>📅</span> 일정 타임라인
            </h3>
            <div className="relative pl-3">
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100" />
              <div className="space-y-6">
                {TIMELINE.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start relative">
                    <div className={`relative z-10 h-3.5 w-3.5 rounded-full shrink-0 mt-1 ${
                        step.done
                          ? 'bg-slate-300'
                          : step.active
                          ? 'bg-[#00D09E] ring-4 ring-[#00D09E]/20'
                          : 'bg-slate-200 border-2 border-white'
                      }`}
                    />
                    <div>
                      <p className={`text-[15px] font-extrabold ${step.active ? 'text-[#00D09E]' : step.done ? 'text-slate-400' : 'text-slate-700'}`}>
                        {step.label}
                        {step.active && (
                          <span className="ml-2 text-[10px] bg-[#00D09E] text-white px-2 py-0.5 rounded-md font-bold align-middle inline-block -mt-0.5">D-4</span>
                        )}
                      </p>
                      <p className="text-[13px] font-medium text-slate-500 mt-1 whitespace-pre-line">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </BentoBox>

        </div>
        {/* ══════════════ /좌측 메인 ══════════════ */}

        {/* ══════════════ 우측 스티키 사이드패널 (PC 전용) ══════════════ */}
        <div className="hidden lg:block">
          <div className="sticky top-20 space-y-4">

            {/* 📊 자산 성장 시뮬레이터 */}
            <BentoBox className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD54F]/10 rounded-full blur-3xl -mr-10 -mt-10" />
              <h3 className="flex items-center gap-2 font-bold text-[16px] text-slate-900 mb-5 relative z-10">
                <span>📈</span> 자산 성장 시뮬레이터
              </h3>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-bold text-slate-500">현재 주변 아파트 시세</span>
                  <span className="text-[14px] font-extrabold text-slate-800">{formatMoney(notice.current_market_price)}원</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-bold text-[#00D09E]">10년 뒤 주변 시세 (예상)</span>
                  <span className="text-[14px] font-extrabold text-[#00D09E]">{formatMoney(Math.round(notice.current_market_price * 1.63))}원</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-bold text-slate-500">나의 분양 전환가 (할인)</span>
                  <span className="text-[14px] font-extrabold text-slate-800">{formatMoney(notice.conversion_price)}원</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[14px] font-black text-orange-600">순수익 (자산 증가)</span>
                  <span className="text-[20px] font-black text-orange-600">+{formatMoney(notice.expected_profit)}원</span>
                </div>
              </div>
            </BentoBox>

            {/* 사이드패널 액션 버튼 */}
            <div className="flex gap-2.5">
              <a
                href={notice.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-4 text-[15px] font-extrabold text-slate-700 active:scale-[0.98] transition-transform hover:bg-slate-200"
              >
                <FileText className="h-4 w-4" />
                공고 원문
              </a>
              <button className="flex-[1.5] flex items-center justify-center gap-1.5 rounded-2xl bg-[#00D09E] py-4 text-[15px] font-extrabold text-white shadow-lg shadow-[#00D09E]/30 active:scale-[0.98] transition-transform hover:bg-[#00b388]">
                <Bell className="h-4 w-4" />
                알림 구독하기
              </button>
            </div>

          </div>
        </div>
        {/* ══════════════ /우측 사이드패널 ══════════════ */}

      </div>

      {/* 📊 자산 성장 시뮬레이터 — 모바일/태블릿 전용 (lg 이하) */}
      <div className="lg:hidden mt-4">
        <BentoBox className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD54F]/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <h3 className="flex items-center gap-2 font-bold text-[16px] text-slate-900 mb-5 relative z-10">
            <span>📈</span> 자산 성장 시뮬레이터
          </h3>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[13px] font-bold text-slate-500">현재 주변 아파트 시세</span>
              <span className="text-[14px] font-extrabold text-slate-800">{formatMoney(notice.current_market_price)}원</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[13px] font-bold text-[#00D09E]">10년 뒤 주변 시세 (예상)</span>
              <span className="text-[14px] font-extrabold text-[#00D09E]">{formatMoney(Math.round(notice.current_market_price * 1.63))}원</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[13px] font-bold text-slate-500">나의 분양 전환가 (할인)</span>
              <span className="text-[14px] font-extrabold text-slate-800">{formatMoney(notice.conversion_price)}원</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[14px] font-black text-orange-600">순수익 (자산 증가)</span>
              <span className="text-[20px] font-black text-orange-600">+{formatMoney(notice.expected_profit)}원</span>
            </div>
          </div>
        </BentoBox>
      </div>

      {/* 하단 고정 액션 바 — 모바일/태블릿 전용 */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 px-4 pb-6 pt-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 safe-bottom">
        <div className="flex gap-2.5 max-w-screen-xl mx-auto">
          <a
            href={notice.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-4 text-[15px] font-extrabold text-slate-700 active:scale-[0.98] transition-transform"
          >
            <FileText className="h-4 w-4" />
            공고 원문
          </a>
          <button className="flex-[1.5] flex items-center justify-center gap-1.5 rounded-2xl bg-[#00D09E] py-4 text-[15px] font-extrabold text-white shadow-lg shadow-[#00D09E]/30 active:scale-[0.98] transition-transform">
            <Bell className="h-4 w-4" />
            알림 구독하기
          </button>
        </div>
      </div>

    </div>
  )
}
