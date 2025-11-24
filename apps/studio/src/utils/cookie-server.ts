'use server';

import { cookies } from 'next/headers';

export async function setCookieServer(
  key: string,
  value: string,
  options: {
    path?: string;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
) {
  const {
    path = '/',
    maxAge = 60 * 60 * 24 * 7, // 7-day default
    httpOnly = false,
    secure = process.env.NODE_ENV === 'production',
    sameSite = process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  } = options;

  const cookieStore = await cookies();

  cookieStore.set(key, value, {
    path,
    maxAge,
    httpOnly,
    secure,
    sameSite,
  });
}

export async function deleteCookieServer(
  key: string,
  options: {
    path?: string;
  } = {}
) {
  const { path = '/' } = options;

  const cookieStore = await cookies();

  cookieStore.delete({
    name: key,
    path,
  });
}
