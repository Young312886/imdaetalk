import { notFound } from 'next/navigation'
import { dummyNotices, formatMoney } from '@/data/dummyNotices'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, CheckCircle2, XCircle, Clock,
  FileText, Bell, MapPin, Calculator
} from 'lucide-react'

interface PageProps {
  params: { id: string }
}

const CHECKLIST_ITEMS = [
  { key: 'age', label: '나이 조건 (만 19~39세)', met: true },
  { key: 'noHouse', label: '무주택 세대 구성원', met: true },
  { key: 'subscription', label: '청약통장 납입 (6개월 이상)', met: true },
  { key: 'income', label: '소득 기준 (도근자 120% 이하)', met: true },
  { key: 'region', label: '거주 지역 (서울시 거주)', met: true },
]

export default function DetailPage({ params }: PageProps) {
  const notice = dummyNotices.find(n => n.id === params.id)
  if (!notice) notFound()

  const profitRate = Math.round(
    ((notice.expected_profit) / notice.current_market_price) * 100
  )

  const TIMELINE = [
    { label: '모집공고', date: notice.published_at, done: true },
    { label: '청약 접수', date: `${notice.subscription_open} ~ ${notice.subscription_close}`, done: false, active: true },
    { label: '당첨 발표', date: notice.winner_announce, done: false },
    { label: '계약', date: notice.contract_date, done: false },
  ]

  return (
    <div>
      {/* Hero 섹션 – 예상 시세 차익 */}
      <div className="px-4 pt-5 pb-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
        <p className="text-indigo-200 text-sm mb-2 font-medium">
          10년 뒤 예상 결과
        </p>
        <h1 className="text-2xl font-extrabold text-white leading-tight mb-1">
          이 공고에 당첨되면<br />
          <span className="text-yellow-300">
            +{formatMoney(notice.expected_profit)}원
          </span>
          을 버실 수 있어요 🚀
        </h1>
        <p className="text-indigo-200 text-sm mt-2">
          현재 주변 시세 대비 +{profitRate}% 수익률 시뮬레이션 결과
        </p>

        {/* 시뮬레이션 요약 카드 */}
        <div className="mt-4 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <Calculator className="h-4 w-4 text-yellow-300" />
            <span className="text-xs font-semibold text-white">분양전환가 시뮬레이션</span>
          </div>
          <div className="space-y-2">
            {[
              { label: '현재 주변 시세', value: formatMoney(notice.current_market_price), color: 'text-white/70' },
              { label: '10년 뒤 예상 시세', value: formatMoney(Math.round(notice.current_market_price * 1.63)), color: 'text-white/70' },
              { label: '예상 분양전환가', value: formatMoney(notice.conversion_price), color: 'text-white/70' },
              { label: '예상 차익', value: `+${formatMoney(notice.expected_profit)}`, color: 'text-yellow-300 font-extrabold' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-white/60">{row.label}</span>
                <span className={`text-sm ${row.color}`}>{row.value}원</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 공고 기본 정보 */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-1.5 mb-1">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{notice.region} {notice.district}</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">{notice.title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">공고일 {notice.published_at}</p>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* AI 3줄 요약 */}
        <section>
          <h3 className="flex items-center gap-2 font-bold text-base mb-3">
            <span>🤖</span> AI 3줄 요약
          </h3>
          <div className="space-y-2">
            {notice.ai_summary.map((line, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl bg-indigo-50 border border-indigo-100 p-3"
              >
                <Badge className="shrink-0 h-5 w-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center p-0">
                  {i + 1}
                </Badge>
                <p className="text-sm text-foreground/85 leading-relaxed">{line}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 내 조건 부합 여부 */}
        <section>
          <h3 className="flex items-center gap-2 font-bold text-base mb-3">
            <span>📋</span> 내 조건 부합 여부
          </h3>

          {notice.eligibility_note && (
            <div className="mb-3 rounded-xl bg-rose-50 border border-rose-100 p-3 text-sm text-rose-700">
              {notice.eligibility_note}
            </div>
          )}

          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((item) => (
              <div
                key={item.key}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  item.met
                    ? 'bg-emerald-50 border-emerald-100'
                    : 'bg-rose-50 border-rose-100'
                }`}
              >
                {item.met ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                )}
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700">
            💡 조건이 정확하지 않을 수 있어요. 마이페이지에서 내 조건을 입력하면 자동으로 판단해드려요.
          </div>
        </section>

        {/* 청약 일정표 */}
        <section>
          <h3 className="flex items-center gap-2 font-bold text-base mb-3">
            <span>📅</span> 청약 일정표
          </h3>
          <div className="relative pl-4">
            {/* 세로 선 */}
            <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-border" />

            <div className="space-y-4">
              {TIMELINE.map((step, i) => (
                <div key={i} className="flex gap-4 items-start relative">
                  {/* 원형 마커 */}
                  <div
                    className={`relative z-10 h-4 w-4 rounded-full shrink-0 mt-0.5 ${
                      step.done
                        ? 'bg-emerald-400'
                        : step.active
                        ? 'bg-primary ring-2 ring-primary/30'
                        : 'bg-border'
                    }`}
                  />
                  <div>
                    <p className={`text-sm font-semibold ${step.active ? 'text-primary' : step.done ? 'text-muted-foreground' : 'text-foreground/60'}`}>
                      {step.label}
                      {step.active && (
                        <span className="ml-2 text-xs bg-primary text-white px-1.5 py-0.5 rounded-full">진행 중</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 하단 고정 액션 바 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 px-4 pb-6 pt-3 bg-white/95 backdrop-blur-sm border-t border-border safe-bottom">
        <div className="flex gap-3">
          <a
            href={notice.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border bg-white py-3.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <FileText className="h-4 w-4" />
            공고 원문 보기
          </a>
          <button className="flex-1 flex items-center justify-center gap-2 rounded-xl gradient-primary py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]">
            <Bell className="h-4 w-4" />
            알림 구독하기
          </button>
        </div>
      </div>
    </div>
  )
}
