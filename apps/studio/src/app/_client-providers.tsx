'use client';

import { HeroUIProvider } from '@heroui/system';
import { ThemeProvider } from 'next-themes';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { AQUA_SESSION_TOKEN } from '@/constants/aqua-constants';
import { AppProvider } from '@/contexts/app-context';
import type { SessionInterface } from '@/interfaces/session-interfaces';
import type { UserInterface } from '@/interfaces/user-interfaces';
import { fetchClient } from '@/utils/fetch-client';
import { deleteLocalStorageItem } from '@/utils/local-storage';

const ClientProviders = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const [initialState, setInitialState] = useState<{
    user?: UserInterface;
    session?: SessionInterface;
    isProfileLoading?: boolean;
  }>({
    isProfileLoading: true,
  });

  useEffect(() => {
    const abortController = new AbortController();

    const loadProfile = async () => {
      try {
        const { data } = await fetchClient<{ user: UserInterface; session: SessionInterface }>({
          url: '/v1/profile',
          signal: abortController.signal,
        });

        if (data) {
          if (!abortController.signal.aborted)
            setInitialState({
              user: data?.user ?? undefined,
              session: data?.session ?? undefined,
              isProfileLoading: false,
            });
        } else {
          deleteLocalStorageItem(AQUA_SESSION_TOKEN);
          if (!abortController.signal.aborted) setInitialState((prev) => ({ ...prev, isProfileLoading: false }));
        }
      } catch {
        if (!abortController.signal.aborted) setInitialState((prev) => ({ ...prev, isProfileLoading: false }));
      }
    };

    loadProfile().then();

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <ThemeProvider attribute='class' defaultTheme='light'>
      <HeroUIProvider className='flex h-full w-full grow flex-col' navigate={router.push} locale='en-US'>
        <AppProvider initialState={initialState}>{children}</AppProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
};

export default ClientProviders;
