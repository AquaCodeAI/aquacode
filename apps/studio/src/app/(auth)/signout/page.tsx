'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui';
import { useAppStore } from '@/hooks/use-app-store';
import { SignOutInterface } from '@/interfaces/auth-interfaces';
import { fetchClient } from '@/utils/fetch-client';
import { deleteLocalStorageItem } from '@/utils/local-storage';
import { AQUA_SESSION_TOKEN } from '@/constants/aqua-constants';

export const dynamic = 'force-dynamic';

const Page = () => {
  const router = useRouter();
  const setUser = useAppStore((store) => store.setUser);
  const setSession = useAppStore((store) => store.setSession);
  const [hasSignedOut, setHasSignedOut] = useState(false);

  const signOut = async () => {
    try {
      await fetchClient<SignOutInterface>({
        url: '/v1/sign-out',
        method: 'POST',
      });

      deleteLocalStorageItem(AQUA_SESSION_TOKEN);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setUser(undefined);
      setSession(undefined);
      router.push(window.location.origin);
    }
  };

  useEffect(() => {
    if (!hasSignedOut) {
      setHasSignedOut(true);
      signOut().then();
    }
  }, [hasSignedOut]);

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <Spinner size='lg' />
    </div>
  );
};

export default Page;
