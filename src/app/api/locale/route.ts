import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isLocaleCode, LOCALE_COOKIE, THEME_COOKIE } from '@/lib/i18n/config';

const bodySchema = z.object({
  locale: z.string().optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });

  if (parsed.data.locale) {
    res.cookies.set(LOCALE_COOKIE, 'en', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  if (parsed.data.theme) {
    res.cookies.set(THEME_COOKIE, parsed.data.theme, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  return res;
}
