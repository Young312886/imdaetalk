'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, User, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function GNB() {
  const pathname = usePathname()

  // 특정 페이지에서는 GNB 숨김
  const hideGNB = pathname.startsWith('/auth')
  if (hideGNB) return null

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/50">
      <div className="flex h-14 items-center justify-between px-4">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
            <Home className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gradient-primary">
            임대톡
          </span>
        </Link>

        {/* 우측 액션 버튼 */}
        <div className="flex items-center gap-1">
          {/* 알림 버튼 */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Link href="/mypage?tab=alerts" aria-label="알림 설정">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>

          {/* 마이페이지 / 로그인 버튼 */}
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <Link href="/mypage" aria-label="마이페이지">
              <User className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
