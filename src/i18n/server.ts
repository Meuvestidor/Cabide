import 'server-only';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, resolveLocale, type Locale } from './config';
import { createTranslator, getMessages } from './translate';

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return resolveLocale(store.get(LOCALE_COOKIE)?.value);
}

export async function getServerT() {
  return createTranslator(getMessages(await getLocale()));
}
