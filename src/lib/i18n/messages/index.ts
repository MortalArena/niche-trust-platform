import type { LocaleCode } from '../config';
import { en, type Messages } from './en';
import { ar } from './ar';

/**
 * English is the primary UI language.
 * Arabic has a full translation. All other locale codes use English strings
 * (native names still shown in the language picker).
 */
export function getMessages(locale: LocaleCode): Messages {
  if (locale === 'ar') return ar;
  return en;
}
