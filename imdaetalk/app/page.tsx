import { NoticeCard } from '@/components/NoticeCard'
import { FAB } from '@/components/FAB'
import { dummyNotices } from '@/data/dummyNotices'
import { Sparkles } from 'lucide-react'

export default function HomePage() {
  const eligibleCount = dummyNotices.filter(n => n.is_eligible).length

  return (
    <div className="relative pb-6">
      {/* 🏡 개인화 헤더 */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-2xl pt-0.5">🙌</span>
          <h1 className="text-[22px] font-extrabold text-slate-800 tracking-tight">
            오늘의 맞춤 공고
          </h1>
        </div>
        <p className="text-[14px] text-slate-500 font-medium">
          지원 가능한 줍줍 공고{' '}
          <span className="font-extrabold text-[#00D09E]">{eligibleCount}건</span>이 있어요
        </p>
      </div>

      {/* 🚀 로그인 유도 배너 (비로그인 상태) - 벤토 박스 느낌의 둥근 배너 */}
      <div className="mx-4 mb-6 rounded-3xl bg-gradient-to-br from-[#00D09E] to-[#00b388] p-5 shadow-lg shadow-[#00D09E]/20 text-white relative overflow-hidden">
        {/* 장식용 원근 이펙트 */}
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute right-10 -bottom-10 w-24 h-24 bg-white/20 rounded-full blur-xl" />
        
        <div className="relative z-10 flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-xl shrink-0 mt-0.5 backdrop-blur-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-[15px] mb-1">내 조건에 딱 맞는 공고만 볼 수 있어요</p>
            <p className="text-[13px] text-white/90 font-medium leading-relaxed">
              카카오로 1초 로그인하면 나이·소득·지역 조건을 자동으로 확인해드려요 🎯
            </p>
          </div>
        </div>
        <a
          href="/auth/login"
          className="relative z-10 mt-4 block w-full rounded-xl bg-white text-[#00b388] py-3 text-center text-[14px] font-extrabold transition-transform active:scale-[0.98] shadow-sm"
        >
          로그인하고 맞춤 공고 받기
        </a>
      </div>

      {/* 🎛️ 필터 영역 */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
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

      {/* 🏘️ 공고 카드 리스트 */}
      <div className="px-0">
        {dummyNotices.map((notice) => (
          <NoticeCard key={notice.id} notice={notice} />
        ))}
      </div>

      {/* 🗺️ 지도 뷰 FAB */}
      <FAB />
    </div>
  )
}
