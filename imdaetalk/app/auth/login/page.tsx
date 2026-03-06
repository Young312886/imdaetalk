'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState<'kakao' | 'naver' | null>(null)
  const supabase = createClient()

  async function handleLogin(provider: 'kakao' | 'naver') {
    setLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {},
      },
    })
    if (error) {
      console.error('로그인 오류:', error.message)
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-6 py-12">
      {/* 로고 & 슬로건 */}
      <div className="text-center mb-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-indigo-500/30 mb-4">
          <span className="text-3xl">🏠</span>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">임대톡</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          어렵고 복잡한 공공임대 청약,<br />
          <strong className="text-foreground">임대톡이 쉽게 알려드려요 🚀</strong>
        </p>
      </div>

      {/* 로그인 혜택 안내 */}
      <div className="w-full max-w-xs rounded-2xl border border-border bg-indigo-50 p-4 mb-6">
        <p className="text-xs font-semibold text-indigo-700 mb-2">로그인하면 이런 게 달라져요</p>
        {[
          '✅ 내 조건에 맞는 공고만 자동 필터링',
          '📊 10년 뒤 시세 차익 자동 시뮬레이션',
          '🔔 새 공고 오픈 시 이메일 알림',
        ].map((benefit) => (
          <p key={benefit} className="text-xs text-indigo-600 py-0.5">{benefit}</p>
        ))}
      </div>

      {/* 소셜 로그인 버튼 */}
      <div className="w-full max-w-xs space-y-3">
        {/* 카카오 */}
        <button
          onClick={() => handleLogin('kakao')}
          disabled={loading !== null}
          className="relative flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-70"
          style={{ backgroundColor: '#FEE500', color: '#191919' }}
          aria-label="카카오로 로그인"
        >
          {loading === 'kakao' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <svg width="20" height="19" viewBox="0 0 20 19" fill="none">
                <path fillRule="evenodd" clipRule="evenodd"
                  d="M10 0C4.477 0 0 3.582 0 8c0 2.86 1.724 5.375 4.327 6.891l-1.1 4.009c-.097.355.327.637.633.42L8.92 16.45A11.51 11.51 0 0010 16.5c5.523 0 10-3.582 10-8S15.523 0 10 0z"
                  fill="#191919"
                />
              </svg>
              카카오로 1초 로그인
            </>
          )}
        </button>

        {/* 네이버 */}
        <button
          onClick={() => handleLogin('naver')}
          disabled={loading !== null}
          className="relative flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-70"
          style={{ backgroundColor: '#03C75A' }}
          aria-label="네이버로 로그인"
        >
          {loading === 'naver' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <span className="text-base font-black leading-none">N</span>
              네이버로 로그인
            </>
          )}
        </button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
        로그인 시 임대톡 이용약관 및 개인정보처리방침에<br />동의하는 것으로 간주됩니다.
      </p>
    </div>
  )
}
