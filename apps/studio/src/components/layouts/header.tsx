'use client';

import { usePathname } from 'next/navigation';
import HeaderLogo from '@/components/app/header/header-logo';
import HeaderUserMenu from '@/components/app/header/header-user-menu';
import HeaderLoginButton from '@/components/app/header/header-login-button';
import { appPaths } from '@/configurations/pages';
import { useAppStore } from '@/hooks/use-app-store';

const UserMenuSkeleton = () => (
  <div className='flex items-center gap-2'>
    <div className='h-10 w-10 animate-pulse rounded-sm bg-neutral-200 dark:bg-neutral-700' />
    <div className='flex flex-col gap-1'>
      <div className='h-4 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700' />
    </div>
  </div>
);

export const Header = () => {
  const pathname = usePathname();
  const isProfileLoading = useAppStore((s) => s.isProfileLoading);
  const session = useAppStore((s) => s.session);
  const user = useAppStore((s) => s.user);

  const shouldHideHeader = pathname?.startsWith(appPaths.projects.to);
  if (shouldHideHeader) {
    return null;
  }

  const isLoggedIn = !!session && !!user;

  return (
    <header
      data-component-name='Header'
      className='sticky top-0 z-40 flex h-16 items-center justify-between gap-4 px-4 min-[1280px]:px-52 min-[1280px]:py-10'
    >
      <div data-component-name='Header/HeaderLeft' className='flex min-w-0 flex-1 items-center justify-start md:gap-4'>
        <HeaderLogo />
      </div>

      <div
        data-component-name='Header/HeaderRight'
        className='flex min-w-0 flex-1 items-center justify-end gap-2 md:gap-4'
      >
        {isProfileLoading ? <UserMenuSkeleton /> : isLoggedIn ? <HeaderUserMenu user={user} /> : <HeaderLoginButton />}
      </div>
    </header>
  );
};
