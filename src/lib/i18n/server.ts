import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, THEME_COOKIE, type LocaleCode } from './config';
import { getMessages } from './messages';

/** English-only UI — ignore locale cookies until i18n is re-enabled */
export async function getServerLocale(): Promise<LocaleCode> {
  return DEFAULT_LOCALE;
}

export async function getServerTheme(): Promise<'light' | 'dark'> {
  const jar = await cookies();
  const raw = jar.get(THEME_COOKIE)?.value;
  if (raw === 'light' || raw === 'dark') return raw;
  return 'light';
}

export async function getServerI18n() {
  const locale = await getServerLocale();
  const theme = await getServerTheme();
  return { locale, theme, messages: getMessages(locale) };
}
