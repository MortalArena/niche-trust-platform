'use client';

import { useApp } from '@/components/providers/app-provider';

/** Always-visible EN / Arabic toggle — English is never hidden */
export function LocaleSwitcher({ compact }: { compact?: boolean }) {
  const { locale, setLocale } = useApp();

  return (
    <div
      className={`flex items-center rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5 ${
        compact ? 'text-xs' : 'text-sm'
      } font-semibold`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => void setLocale('en')}
        className={`rounded-md px-2.5 py-1 transition ${
          locale === 'en'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        aria-pressed={locale === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => void setLocale('ar')}
        className={`rounded-md px-2.5 py-1 transition ${
          locale === 'ar'
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
        aria-pressed={locale === 'ar'}
      >
        عربي
      </button>
    </div>
  );
}
