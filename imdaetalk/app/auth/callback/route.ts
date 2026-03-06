import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 로그인 성공 후 리다이렉트
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 오류 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/auth/login?error=callback_failed`)
}
