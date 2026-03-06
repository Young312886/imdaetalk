import type { Metadata } from 'next'
import './globals.css'
import { GNB } from '@/components/GNB'

export const metadata: Metadata = {
  title: '임대톡 | 내 자산이 되는 공공주택 청약 가이드',
  description:
    '어렵고 복잡한 공공임대 청약, 임대톡이 쉽게 풀어드려요. 10년 뒤 예상 시세 차익과 AI 3줄 요약으로 내 조건에 딱 맞는 공고를 찾아보세요.',
  keywords: ['공공임대', '행복주택', '청약', '1인가구', '무주택', '시세차익', '임대톡'],
  authors: [{ name: '임대톡 팀' }],
  openGraph: {
    title: '임대톡 | 내 자산이 되는 공공주택 청약 가이드',
    description: '10년 뒤 예상 시세 차익으로 공공임대를 자산으로 보는 새로운 시각',
    type: 'website',
    locale: 'ko_KR',
    siteName: '임대톡',
  },
  twitter: {
    card: 'summary_large_image',
    title: '임대톡 | 공공주택 청약 가이드',
    description: 'AI 요약 + 시세 차익 시뮬레이션으로 쉬워지는 청약 정보',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        {/* 모바일 앱처럼 보이는 컨테이너 */}
        <div className="min-h-screen bg-[hsl(var(--surface))]">
          {/* 모바일 중심 래퍼 */}
          <div className="relative mx-auto max-w-md min-h-screen bg-white shadow-xl">
            <GNB />
            <main className="pb-24">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
