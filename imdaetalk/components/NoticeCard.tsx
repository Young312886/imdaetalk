'use client'

import Link from 'next/link'
import { MapPin, CheckCircle2, XCircle, TrendingUp, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { type Notice, formatMoney } from '@/data/dummyNotices'

interface NoticeCardProps {
  notice: Notice
}

const TYPE_COLORS: Record<Notice['type'], string> = {
  행복주택: 'bg-blue-100 text-blue-700',
  국민임대: 'bg-green-100 text-green-700',
  공공분양: 'bg-violet-100 text-violet-700',
  장기전세: 'bg-amber-100 text-amber-700',
  청년안심주택: 'bg-rose-100 text-rose-700',
}

function getDaysBefore(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function NoticeCard({ notice }: NoticeCardProps) {
  const daysLeft = getDaysBefore(notice.subscription_close)
  const isUrgent = daysLeft >= 0 && daysLeft <= 7

  return (
    <Link href={`/detail/${notice.id}`} className="block" aria-label={`${notice.title} 상세 보기`}>
      <article className="mx-4 mb-3 rounded-2xl border border-border bg-white shadow-sm card-hover overflow-hidden">
        {/* 긴급 마감 배너 */}
        {isUrgent && daysLeft >= 0 && (
          <div className="gradient-profit flex items-center gap-1.5 px-4 py-2">
            <Clock className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-semibold text-white">
              마감 D-{daysLeft === 0 ? 'day' : daysLeft}
            </span>
          </div>
        )}

        <div className="p-4">
          {/* 헤더: 유형 배지 + 지역 */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[notice.type]}`}
              >
                {notice.type}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {notice.district}
              </span>
            </div>

            {/* 조건 부합 여부 */}
            {notice.is_eligible ? (
              <div className="flex items-center gap-1 text-emerald-600 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">지원 가능</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-rose-500 shrink-0">
                <XCircle className="h-4 w-4" />
                <span className="text-xs font-medium">조건 확인</span>
              </div>
            )}
          </div>

          {/* 단지명 */}
          <h2 className="font-bold text-base text-foreground mb-3 leading-snug">
            {notice.title}
          </h2>

          {/* ★ 예상 시세 차익 – 핵심 강조 영역 */}
          <div className="mb-4 rounded-xl bg-gradient-to-r from-orange-50 to-rose-50 border border-orange-100 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-medium text-orange-600">10년 뒤 예상 시세 차익</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-gradient-profit">
                +{formatMoney(notice.expected_profit)}
              </span>
              <span className="text-sm text-orange-500 font-semibold">원</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              현재 주변 시세 {formatMoney(notice.current_market_price)}원 기준
            </p>
          </div>

          {/* AI 3줄 요약 (1줄만 미리보기) */}
          <div className="mb-3 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs">🤖</span>
              <span className="text-xs font-semibold text-indigo-600">AI 핵심 요약</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed line-clamp-1">
              {notice.ai_summary[0]}
            </p>
            <p className="text-xs text-indigo-400 mt-0.5">탭해서 전체 보기 →</p>
          </div>

          {/* 보증금 / 월세 정보 */}
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">보증금</span>
              <p className="font-semibold text-foreground">
                {notice.rent_fee === 0
                  ? `${formatMoney(notice.deposit)}원`
                  : `${formatMoney(notice.deposit)}원`}
              </p>
            </div>
            {notice.rent_fee > 0 && (
              <div>
                <span className="text-muted-foreground text-xs">월세</span>
                <p className="font-semibold text-foreground">{notice.rent_fee}만원</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground text-xs">전용면적</span>
              <p className="font-semibold text-foreground">{notice.area_sqm}㎡</p>
            </div>
            <div className="ml-auto text-right">
              <span className="text-muted-foreground text-xs">청약 마감</span>
              <p className="text-xs font-medium text-foreground">{notice.subscription_close}</p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
