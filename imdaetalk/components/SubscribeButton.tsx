'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { toggleSubscription } from '@/utils/supabase/db'

interface SubscribeButtonProps {
  noticeId: string
  isLoggedIn: boolean
  initialSubscribed?: boolean
  className?: string
  variant?: 'mobile' | 'desktop'
}

export function SubscribeButton({
  noticeId,
  isLoggedIn,
  initialSubscribed = false,
  className = '',
  variant = 'mobile',
}: SubscribeButtonProps) {
  const router = useRouter()
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    // 비로그인 → 로그인 페이지로 이동
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=/detail/${noticeId}`)
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push(`/auth/login?redirect=/detail/${noticeId}`)
        return
      }

      const isNowSubscribed = await toggleSubscription(session.user.id, noticeId)
      setSubscribed(isNowSubscribed)
    } catch (err) {
      console.error('구독 처리 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  const baseClass = variant === 'desktop'
    ? 'flex-[1.5] flex items-center justify-center gap-1.5 rounded-2xl py-4 text-[15px] font-extrabold transition-all active:scale-[0.98]'
    : 'flex-[1.5] flex items-center justify-center gap-1.5 rounded-2xl py-4 text-[15px] font-extrabold transition-all active:scale-[0.98]'

  const colorClass = subscribed
    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    : 'bg-[#00D09E] text-white shadow-lg shadow-[#00D09E]/30 hover:bg-[#00b388]'

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={subscribed ? '알림 구독 취소' : '알림 구독하기'}
      className={`${baseClass} ${colorClass} disabled:opacity-70 ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : subscribed ? (
        <>
          <BellOff className="h-4 w-4" />
          구독 취소
        </>
      ) : (
        <>
          <Bell className="h-4 w-4" />
          {isLoggedIn ? '알림 구독하기' : '로그인하고 구독하기'}
        </>
      )}
    </button>
  )
}
