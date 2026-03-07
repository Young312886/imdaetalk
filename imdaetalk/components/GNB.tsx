'use client'

import Link from 'next/link'
import { Bell, UserCircle2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: '청약 찾기' },
  { href: '/mypage', label: '내 가점' },
]

export function GNB() {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  if (isAuthPage) return null

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-slate-100/50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-7 h-7 bg-[#00D09E] rounded-[8px] flex items-center justify-center shadow-md shadow-[#00D09E]/20 group-active:scale-95 transition-transform">
              <span className="text-white text-sm font-black">Z</span>
            </div>
            <span className="font-extrabold text-[18px] text-slate-800 tracking-tight">집스텝</span>
          </Link>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-[14px] font-bold transition-colors ${
                  pathname === link.href
                    ? 'bg-[#00D09E]/10 text-[#00D09E]'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 우측 액션 */}
          <div className="flex items-center gap-2">
            <button
              className="text-slate-400 hover:text-[#00D09E] transition-colors p-2 rounded-xl hover:bg-[#00D09E]/10"
              aria-label="알림"
            >
              <Bell className="h-[22px] w-[22px]" />
            </button>
            <Link
              href="/mypage"
              className="text-slate-400 hover:text-[#00D09E] transition-colors p-2 rounded-xl hover:bg-[#00D09E]/10"
              aria-label="마이페이지"
            >
              <UserCircle2 className="h-6 w-6" />
            </Link>
          </div>

        </div>
      </div>
    </header>
  )
}
