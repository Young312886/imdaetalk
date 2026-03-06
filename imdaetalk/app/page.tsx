import { NoticeCard } from '@/components/NoticeCard'
import { FAB } from '@/components/FAB'
import { dummyNotices } from '@/data/dummyNotices'
import { Sparkles } from 'lucide-react'

export default function HomePage() {
  const eligibleCount = dummyNotices.filter(n => n.is_eligible).length

  return (
    <div className="relative">
      {/* 개인화 헤더 */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">👋</span>
          <h1 className="text-lg font-bold text-foreground">
            오늘의 맞춤 공고
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          지원 가능한 공고{' '}
          <span className="font-semibold text-primary">{eligibleCount}건</span>이 있어요
        </p>
      </div>

      {/* 로그인 유도 배너 (비로그인 상태) */}
      <div className="mx-4 mb-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 p-4 text-white">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm mb-0.5">내 조건에 딱 맞는 공고만 볼 수 있어요</p>
            <p className="text-xs text-white/80">
              카카오로 1초 로그인하면 나이·소득·지역 조건을 자동으로 확인해드려요
            </p>
          </div>
        </div>
        <a
          href="/auth/login"
          className="mt-3 block w-full rounded-lg bg-white/20 hover:bg-white/30 py-2.5 text-center text-sm font-semibold transition-colors"
        >
          로그인하고 맞춤 공고 받기 →
        </a>
      </div>

      {/* 필터 영역 */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {['전체', '서울', '경기', '부산', '인천'].map((region) => (
          <button
            key={region}
            className="shrink-0 rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-primary hover:text-white hover:border-primary first:bg-primary first:text-white first:border-primary"
          >
            {region}
          </button>
        ))}
        <div className="shrink-0 w-px" />
        {['최신순', '차익 높은 순'].map((sort) => (
          <button
            key={sort}
            className="shrink-0 rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary last:mr-4"
          >
            {sort}
          </button>
        ))}
      </div>

      {/* 공고 카드 리스트 */}
      <div className="pb-6">
        {dummyNotices.map((notice) => (
          <NoticeCard key={notice.id} notice={notice} />
        ))}
      </div>

      {/* 지도 뷰 FAB */}
      <FAB />
    </div>
  )
}
