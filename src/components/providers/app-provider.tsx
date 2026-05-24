'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { LocaleCode } from '@/lib/i18n/config';
import { getLocaleMeta } from '@/lib/i18n/config';
import type { Messages } from '@/lib/i18n/messages/en';
import { getMessages } from '@/lib/i18n/messages';

type Theme = 'light' | 'dark';

/** English-only until multi-locale is re-enabled */
function resolveLocale(_code: LocaleCode): LocaleCode {
  return 'en';
}

interface AppContextValue {
  locale: LocaleCode;
  theme: Theme;
  messages: Messages;
  setLocale: (locale: LocaleCode) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  t: Messages;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  initialLocale,
  initialTheme,
}: {
  children: React.ReactNode;
  initialLocale: LocaleCode;
  initialTheme: Theme;
}) {
  const [locale, setLocaleState] = useState(() => resolveLocale(initialLocale));
  const [theme, setThemeState] = useState(initialTheme);

  const messages = useMemo(() => getMessages(locale), [locale]);

  const persist = useCallback(async (patch: { locale?: LocaleCode; theme?: Theme }) => {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  }, []);

  const setLocale = useCallback(
    async (next: LocaleCode) => {
      const resolved = resolveLocale(next);
      setLocaleState(resolved);
      const meta = getLocaleMeta(resolved);
      document.documentElement.lang = resolved;
      document.documentElement.dir = meta.dir;
      await persist({ locale: resolved });
    },
    [persist]
  );

  const setTheme = useCallback(
    async (next: Theme) => {
      setThemeState(next);
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
      await persist({ theme: next });
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      locale,
      theme,
      messages,
      setLocale,
      setTheme,
      t: messages,
    }),
    [locale, theme, messages, setLocale, setTheme]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
