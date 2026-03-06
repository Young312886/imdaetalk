'use client'

import Link from 'next/link'
import { Bell, UserCircle2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function GNB() {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  if (isAuthPage) return null

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-slate-100/50">
      <div className="flex h-14 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 group">
          {/* 앱 아이콘 느낌의 작은 로고 컨테이너 */}
          <div className="w-7 h-7 bg-[#00D09E] rounded-[8px] flex items-center justify-center shadow-md shadow-[#00D09E]/20 group-active:scale-95 transition-transform">
            <span className="text-white text-sm">🏠</span>
          </div>
          <span className="font-extrabold text-[18px] text-slate-800 tracking-tight">임대톡</span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="text-slate-400 hover:text-[#00D09E] transition-colors p-1" aria-label="알림">
            <Bell className="h-[22px] w-[22px]" />
          </button>
          <Link href="/mypage" className="text-slate-400 hover:text-[#00D09E] transition-colors p-1" aria-label="마이페이지">
            <UserCircle2 className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </header>
  )
}
