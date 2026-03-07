import { NoticeCardSkeleton } from '@/components/LoadingSkeleton'

export default function Loading() {
  return (
    <div className="mx-auto w-full pb-16 pt-4">
      {/* 최상단 타이틀 & 혜택 바 부분까지 스켈레톤 처리 (원하면 추가) */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <NoticeCardSkeleton />
        <NoticeCardSkeleton />
        <NoticeCardSkeleton />
        <NoticeCardSkeleton />
        <NoticeCardSkeleton />
        <NoticeCardSkeleton />
      </div>
    </div>
  )
}
