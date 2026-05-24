export const LOCALES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸', dir: 'ltr' as const },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦', dir: 'rtl' as const },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇧🇩', dir: 'ltr' as const },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪', dir: 'ltr' as const },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸', dir: 'ltr' as const },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷', dir: 'ltr' as const },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' as const },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' as const },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹', dir: 'ltr' as const },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵', dir: 'ltr' as const },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷', dir: 'ltr' as const },
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski', flag: '🇵🇱', dir: 'ltr' as const },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇧🇷', dir: 'ltr' as const },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺', dir: 'ltr' as const },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย', flag: '🇹🇭', dir: 'ltr' as const },
  { code: 'tl', label: 'Tagalog', nativeLabel: 'Tagalog', flag: '🇵🇭', dir: 'ltr' as const },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська', flag: '🇺🇦', dir: 'ltr' as const },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳', dir: 'ltr' as const },
] as const;

export type LocaleCode = (typeof LOCALES)[number]['code'];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export const LOCALE_COOKIE = 'nt-locale';
export const THEME_COOKIE = 'nt-theme';

export function isLocaleCode(value: string): value is LocaleCode {
  return LOCALES.some((l) => l.code === value);
}

export function getLocaleMeta(code: LocaleCode) {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}
