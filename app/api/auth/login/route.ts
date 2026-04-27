import { NextResponse } from 'next/server'
import { validateOwnerPassword, setSessionCookie } from '@/lib/auth'

export async function POST(req: Request) {
  let password: string | undefined
  try {
    const body = await req.json()
    password = body?.password
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (typeof password !== 'string' || password.length === 0) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  if (!process.env.OWNER_PASSWORD) {
    return NextResponse.json(
      {
        error:
          'OWNER_PASSWORD is not set on this deployment. Add it to your environment variables and redeploy.',
      },
      { status: 503 }
    )
  }

  const owner = await validateOwnerPassword(password)
  if (!owner) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  await setSessionCookie(owner.id)
  return NextResponse.json({ success: true })
}
