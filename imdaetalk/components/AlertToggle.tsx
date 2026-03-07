'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Bell, BellOff, Loader2 } from 'lucide-react'

interface AlertToggleProps {
  userId: string
  initialEnabled: boolean
}

export function AlertToggle({ userId, initialEnabled }: AlertToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleToggle = async () => {
    if (isLoading) return
    setIsLoading(true)
    const newValue = !enabled

    // 낙관적 업데이트
    setEnabled(newValue)

    const { error } = await supabase
      .from('profiles')
      .update({ alert_enabled: newValue })
      .eq('id', userId)

    if (error) {
      // 롤백
      console.error('알림 설정 변경 오류:', error.message)
      setEnabled(!newValue)
      alert('설정 변경에 실패했습니다. 다시 시도해 주세요.')
    }
    setIsLoading(false)
  }

  return (
    <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-100">
      <div className="flex items-center gap-3">
        {enabled ? (
          <Bell className="h-5 w-5 text-[#00D09E]" />
        ) : (
          <BellOff className="h-5 w-5 text-slate-400" />
        )}
        <div>
          <p className="text-[14px] font-bold text-slate-800">맞춤 공고 알림</p>
          <p className="text-[12px] text-slate-400 font-medium">
            {enabled ? '알림 수신 중' : '알림 꺼짐'}
          </p>
        </div>
      </div>
      
      {/* 둥근 토글 버튼 */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={handleToggle}
        disabled={isLoading}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00D09E] focus-visible:ring-offset-2 disabled:opacity-50 ${
          enabled ? 'bg-[#00D09E]' : 'bg-slate-200'
        }`}
      >
        <span className="sr-only">이메일 알림 설정</span>
        {isLoading ? (
          <Loader2 className={`h-4 w-4 animate-spin text-white absolute ${enabled ? 'right-1' : 'left-1'}`} />
        ) : (
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-[22px]' : '-translate-x-[2px]'
            }`}
          />
        )}
      </button>
    </div>
  )
}
