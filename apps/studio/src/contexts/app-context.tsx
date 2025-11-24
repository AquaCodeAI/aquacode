'use client';

import { AppState, createAppStore } from '@/stores/app-store';
import { createContext, type ReactNode, useEffect, useRef } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/hooks/use-app-store';
import { setCookieClient } from '@/utils/cookie-client';
import { AQUA_IS_DARK_KEY, AQUA_SESSION_TOKEN } from '@/constants/aqua-constants';
import { getLocalStorageItem } from '@/utils/local-storage';

type AppStoreApi = ReturnType<typeof createAppStore>;

export const AppStoreContext = createContext<AppStoreApi | undefined>(undefined);

interface Props {
  children: ReactNode;
  initialState?: Partial<AppState>;
}

export const AppProvider = ({ children, initialState }: Props) => {
  const storeRef = useRef<AppStoreApi>(createAppStore({ ...initialState }));

  return (
    <AppStoreContext value={storeRef.current}>
      <AppProviderChildren initialState={initialState}>{children}</AppProviderChildren>
    </AppStoreContext>
  );
};

const AppProviderChildren = ({ children, initialState }: Props) => {
  const {
    currentState: { isDark },
  } = useTheme();
  const setIsDark = useAppStore((store) => store.setIsDark);
  const setUser = useAppStore((store) => store.setUser);
  const setSession = useAppStore((store) => store.setSession);
  const setIsProfileLoading = useAppStore((store) => store.setIsProfileLoading);
  const connectSocket = useAppStore((store) => store.connectSocket);
  const disconnectSocket = useAppStore((store) => store.disconnectSocket);
  const sessionToken: string | undefined = getLocalStorageItem(AQUA_SESSION_TOKEN);

  useEffect(() => {
    setCookieClient(AQUA_IS_DARK_KEY, isDark.toString());
    setIsDark(isDark);
  }, [isDark, setIsDark]);

  useEffect(() => {
    setUser(initialState?.user);
    setSession(initialState?.session);
    setIsProfileLoading(initialState?.isProfileLoading);
  }, [
    initialState?.user,
    initialState?.session,
    initialState?.isProfileLoading,
    setUser,
    setSession,
    setIsProfileLoading,
  ]);

  useEffect(() => {
    connectSocket(sessionToken);
    return () => {
      disconnectSocket();
    };
  }, [connectSocket, disconnectSocket, sessionToken]);

  return children;
};
