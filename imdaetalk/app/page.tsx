import { NoticeCard } from '@/components/NoticeCard'
import { FAB } from '@/components/FAB'
import { getNotices } from '@/utils/supabase/db'
import { Sparkles, Calculator } from 'lucide-react'

export default async function HomePage() {
  const notices = await getNotices(20).catch(() => [])
  // is_eligible 로직은 나중에 프로필 매칭 시 추가 구현
  const eligibleCount = 0

  return (
    <div className="relative pb-6 pt-6">

      {/* 🏡 히어로 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-2xl">💸</span>
          <h1 className="text-[24px] font-extrabold text-slate-800 tracking-tight">
            돈 되는 청약, 지금 찾아보세요
          </h1>
        </div>
        <p className="text-[14px] text-slate-500 font-medium">
          내 가점으로 지원 가능한 공고{' '}
          <span className="font-extrabold text-[#00D09E]">{eligibleCount}건</span>이 있어요
        </p>
      </div>

      {/* 🚀 로그인 유도 배너 — 벤토 박스 */}
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-[#00D09E] to-[#00b388] p-5 shadow-lg shadow-[#00D09E]/20 text-white relative overflow-hidden">
        {/* 장식 원근 이펙트 */}
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute right-10 -bottom-10 w-24 h-24 bg-white/20 rounded-full blur-xl" />

        <div className="relative z-10 flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-xl shrink-0 mt-0.5 backdrop-blur-md">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-[15px] mb-1">
              내 가점으로 얼마나 벌 수 있는지 계산해드릴게요 🧮
            </p>
            <p className="text-[13px] text-white/90 font-medium leading-relaxed">
              30초 프로필 입력으로 맞춤 수익 계산 시작 — 지금 바로 확인해보세요
            </p>
          </div>
        </div>
        <a
          href="/auth/login"
          className="relative z-10 mt-4 block w-full rounded-xl bg-white text-[#00b388] py-3 text-center text-[14px] font-extrabold transition-transform active:scale-[0.98] shadow-sm sm:w-auto sm:inline-block sm:px-8"
        >
          로그인하고 맞춤 수익 계산하기
        </a>
      </div>

      {/* 🎛️ 필터 영역 */}
      <div className="flex gap-2 pb-5 overflow-x-auto no-scrollbar">
        {['전체', '서울', '경기', '부산', '인천'].map((region, i) => (
          <button
            key={region}
            className={`shrink-0 rounded-xl px-4 py-2 text-[14px] font-bold transition-colors ${
              i === 0
                ? 'bg-[#00D09E] text-white shadow-md shadow-[#00D09E]/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {region}
          </button>
        ))}
        <div className="shrink-0 w-px" />
        {['최신순', '차익 높은 순'].map((sort) => (
          <button
            key={sort}
            className="shrink-0 rounded-xl bg-white border border-slate-200 px-4 py-2 text-[14px] font-bold text-slate-600 transition-colors hover:bg-slate-50 last:mr-4"
          >
            {sort}
          </button>
        ))}
      </div>

      {/* 🏘️ 공고 카드 리스트 — 반응형 그리드 */}
      {/* 모바일: 1컬럼 / 태블릿(md): 2컬럼 / PC(xl): 3컬럼 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {notices.map((notice) => (
          <NoticeCard key={notice.id} notice={notice as any} />
        ))}
        {notices.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-500 font-medium">
            현재 데이터베이스에 등록된 공고가 없습니다. 크롤러를 실행해주세요!
          </div>
        )}
      </div>

      {/* 🗺️ 지도 뷰 FAB */}
      <FAB />
    </div>
  )
}
