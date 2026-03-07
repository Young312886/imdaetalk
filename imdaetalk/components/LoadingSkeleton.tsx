import { Skeleton } from '@/components/ui/skeleton'

export function NoticeCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      {/* 뱃지 영역 */}
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      
      {/* 제목 및 지역 */}
      <div className="space-y-2 mb-6">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>
      
      {/* 가격 정보 */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      </div>
      
      {/* 차익 계산 하이라이트 박스 */}
      <div className="mt-auto rounded-xl bg-slate-50 p-3 flex justify-between items-center">
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="h-5 w-24 rounded-md" />
      </div>
    </div>
  )
}

export function DetailPageSkeleton() {
  return (
    <div className="pb-24 pt-4 lg:pt-8 max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* === 좌측 메인 콘텐츠 영역 === */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Hero Section */}
          <div className="mb-6">
            <Skeleton className="h-8 w-24 rounded-full mb-4" />
            <Skeleton className="h-8 w-3/4 rounded-md mb-2" />
            <Skeleton className="h-8 w-1/2 rounded-md mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
          </div>

          <Skeleton className="h-[200px] w-full rounded-2xl" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
          <Skeleton className="h-[150px] w-full rounded-2xl" />
        </div>

        {/* === 우측 스티키 사이드패널 영역 === */}
        <div className="w-full lg:w-[380px] shrink-0">
          <div className="lg:sticky lg:top-[88px] flex flex-col gap-6">
            <Skeleton className="h-[400px] w-full rounded-2xl" />
            <Skeleton className="hidden lg:block h-14 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
