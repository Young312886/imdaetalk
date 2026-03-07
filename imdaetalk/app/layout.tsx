import type { Metadata } from 'next'
import './globals.css'
import { GNB } from '@/components/GNB'

export const metadata: Metadata = {
  title: '집스텝 | 1인가구를 위한 돈 되는 청약 계산기',
  description:
    '당첨되면 얼마 벌까? 복잡한 공공임대/분양 공고를 AI가 3줄로 요약하고, 10년 뒤 예상 시세 차익까지 계산해 드려요. 내 가점으로 갈 수 있는 맞춤형 청약을 지금 확인하세요.',
  keywords: [
    '1인가구 청약',
    '청약가점 계산기',
    '공공임대',
    '분양전환',
    '행복주택',
    '시세차익',
    '청약알리미',
    '무주택',
    '내집마련',
    '집스텝',
  ],
  authors: [{ name: '집스텝 팀' }],
  openGraph: {
    title: '당첨되면 얼마 벌까? 1인가구 맞춤 청약 가이드',
    description: '어려운 공고문은 AI가 읽어드릴게요. 10년 뒤 내 자산이 될 집스텝을 찾아보세요.',
    type: 'website',
    locale: 'ko_KR',
    siteName: '집스텝 (ZipStep)',
  },
  twitter: {
    card: 'summary_large_image',
    title: '집스텝 | 1인가구 맞춤 공공주택 청약 가이드',
    description: 'AI 공고 요약부터 10년 뒤 예상 시세차익 시뮬레이션까지.',
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
        {/* 전체 화면 배경 */}
        <div className="min-h-screen bg-[hsl(var(--surface))]">
          <GNB />
          {/* 반응형 웹앱 컨테이너: 모바일~PC 전 구간 대응 */}
          <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
