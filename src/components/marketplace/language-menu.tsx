'use client';

import { useState, useRef, useEffect } from 'react';
import { LOCALES } from '@/lib/i18n/config';
import { useApp } from '@/components/providers/app-provider';

const SORTED_LOCALES = [
  LOCALES.find((l) => l.code === 'ar')!,
  ...LOCALES.filter((l) => l.code !== 'en' && l.code !== 'ar'),
];

export function LanguageMenu() {
  const { locale, setLocale, t } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
      >
        <span className="flex items-center gap-2">
          <span className="text-base">{current.flag}</span>
          {t.menu.language}
        </span>
        <span className="text-[var(--text-muted)]">›</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-1 max-h-72 w-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-xl">
          <button
            type="button"
            onClick={() => {
              void setLocale('en');
              setOpen(false);
            }}
            className="flex w-full items-center gap-3 border-b border-[var(--border)] px-3 py-2.5 text-left text-sm font-semibold text-blue-600 hover:bg-[var(--surface-hover)]"
          >
            <span className="text-lg">🇺🇸</span>
            <span className="flex-1">English — primary</span>
            {locale === 'en' && <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden />}
          </button>
          {SORTED_LOCALES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                void setLocale(l.code);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-[var(--surface-hover)]"
            >
              <span className="text-lg">{l.flag}</span>
              <span className="flex-1 text-[var(--text-primary)]">
                {l.nativeLabel}
                {l.code !== 'ar' && (
                  <span className="ml-1 block text-xs text-[var(--text-muted)]">UI in English</span>
                )}
              </span>
              {locale === l.code && l.code === 'ar' && (
                <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
