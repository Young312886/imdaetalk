'use client'

import Link from 'next/link'
import { Map } from 'lucide-react'

interface FABProps {
  href?: string
  onClick?: () => void
}

export function FAB({ href = '/map', onClick }: FABProps) {
  const content = (
    <div className="flex items-center gap-2 px-4 py-3 gradient-primary rounded-2xl shadow-lg shadow-indigo-500/30 text-white font-semibold text-sm transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95">
      <Map className="h-4 w-4" />
      <span>지도 보기</span>
    </div>
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="fixed bottom-6 right-4 z-50"
        aria-label="지도 뷰로 보기"
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href={href}
      className="fixed bottom-6 right-4 z-50"
      aria-label="지도 뷰로 보기"
    >
      {content}
    </Link>
  )
}
