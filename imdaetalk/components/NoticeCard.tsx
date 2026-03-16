'use client'

import Link from 'next/link'
import { MapPin, CheckCircle2, XCircle, TrendingUp, Clock } from 'lucide-react'
import { type NoticeWithSummary } from '@/utils/supabase/db'
import { formatMoney } from '@/data/dummyNotices'

interface NoticeCardProps {
  notice: NoticeWithSummary
}

const TYPE_COLORS: Record<string, string> = {
  행복주택: 'bg-emerald-50 text-emerald-600',
  국민임대: 'bg-blue-50 text-blue-600',
  공공분양: 'bg-purple-50 text-purple-600',
  장기전세: 'bg-amber-50 text-amber-600',
  청년안심주택: 'bg-rose-50 text-rose-600',
  default: 'bg-slate-50 text-slate-600',
}

function getDaysBefore(dateStr: string): number {
  if (!dateStr) return -1
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function NoticeCard({ notice }: NoticeCardProps) {
  const daysLeft = getDaysBefore(notice.subscription_close)
  const isUrgent = daysLeft >= 0 && daysLeft <= 7
  const typeColor = TYPE_COLORS[notice.type] || TYPE_COLORS.default

  // DB 구조에 맞게 매핑 (notice_ai_summary join 결과)
  const ai_summary = notice.notice_ai_summary 
    ? [notice.notice_ai_summary.summary_line1, notice.notice_ai_summary.summary_line2, notice.notice_ai_summary.summary_line3]
    : ['AI가 요약을 준비 중이에요 ⏳', '', '']

  // is_eligible은 나중에 프로필 매칭 시 실제 로직 적용 (현재는 true 기본값)
  const is_eligible = true 

  return (
    <Link href={`/detail/${notice.id}`} className="block" aria-label={`${notice.title} 상세 보기`}>
      <article className="bento-box card-hover overflow-hidden relative">
        {/* 긴급 마감 배너 */}
        {isUrgent && (
          <div className="bg-[#FFD54F] flex items-center gap-1.5 px-5 py-2.5">
            <Clock className="h-4 w-4 text-orange-700" />
            <span className="text-xs font-bold text-orange-900">
              마감 D-{daysLeft === 0 ? 'day' : daysLeft} ⏳
            </span>
          </div>
        )}

        <div className="p-5">
          {/* 헤더: 조건 & 지역 */}
          <div className="flex items-center justify-between mb-4">
            {/* 조건 부합 여부 뱃지 */}
            {is_eligible ? (
              <div className="flex items-center gap-1.5 text-[#00D09E] bg-[#00D09E]/10 px-2.5 py-1.5 rounded-lg border border-[#00D09E]/20">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-[12px] font-bold tracking-tight">지원 가능 🎯</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                <XCircle className="h-4 w-4" />
                <span className="text-[12px] font-bold tracking-tight">조건 확인 🥲</span>
              </div>
            )}

            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
              <MapPin className="h-3 w-3" />
              {notice.district || notice.region}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-extrabold ${typeColor}`}>
              {notice.type}
            </span>
          </div>

          {/* 단지명 */}
          <h2 className="font-extrabold text-[19px] text-slate-900 mb-5 leading-snug tracking-tight">
            {notice.title}
          </h2>

          {/* ★ 예상 시세 차익 벤토 박스 내부 모듈 */}
          <div className="mb-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/20 p-4 border border-orange-100/50 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-[12px] font-bold text-orange-600 tracking-tight">10년 뒤 예상 시세 차익</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[32px] font-black text-gradient-profit tracking-tighter leading-none">
                +{formatMoney(Math.floor(notice.expected_profit_10y / 10000))}
              </span>
              <span className="text-sm text-orange-600 font-extrabold pb-1">원</span>
            </div>
          </div>

          {/* AI 3줄 요약 미리보기 (벤토 박스 모듈) */}
          <div className="mb-5 rounded-xl bg-slate-50/80 border border-slate-100 p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[13px] font-bold text-slate-700">💬 AI 핵심 요약</span>
            </div>
            <p className="text-[13px] text-slate-600 font-medium leading-relaxed line-clamp-1">
              {ai_summary[0]}
            </p>
          </div>

          {/* 하단 요약 스펙 */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">보증금</span>
              <p className="font-extrabold text-slate-800 text-[14px]">
                {formatMoney(Math.floor(notice.deposit / 10000))}
              </p>
            </div>
            {notice.rent_fee > 0 && (
              <div className="flex flex-col text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">월세</span>
                <p className="font-extrabold text-slate-800 text-[14px]">{Math.floor(notice.rent_fee / 10000)}만</p>
              </div>
            )}
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">면적</span>
              <p className="font-extrabold text-slate-800 text-[14px]">{notice.area_sqm}㎡</p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
