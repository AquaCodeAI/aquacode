import { ArrowRightStartOnRectangleIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from '@/components/ui';
import { authPages } from '@/configurations/pages';
import { useTheme } from '@/hooks/use-theme';
import { UserInterface } from '@/interfaces/user-interfaces';
import { cn } from '@/utils/cn';
import HeaderUserProfile from './header-user-profile';

interface HeaderUserMenuProps {
  user: UserInterface;
}

// UI Labels
const LABEL_LOGOUT = 'Logout';
const LABEL_THEME = 'Theme';
const LABEL_LIGHT = 'Light';
const LABEL_DARK = 'Dark';

// Fallback Values
const FALLBACK_USER_NAME = '';

export default function HeaderUserMenu({ user }: HeaderUserMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentState, setCurrentTheme } = useTheme();

  const displayName = user.name || FALLBACK_USER_NAME;

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
  };

  return (
    <Dropdown
      placement='bottom-end'
      className='border border-neutral-200 bg-neutral-50 px-1 py-1 dark:border-neutral-700 dark:bg-neutral-800'
      isOpen={isMenuOpen}
      onOpenChange={setIsMenuOpen}
      shadow='none'
    >
      <DropdownTrigger>
        <Button className='flex items-center gap-2' variant='ligth'>
          <Avatar radius='sm' name={displayName} size='md' src={user.avatar} />
          <div className='flex flex-col items-start'>
            <span className='text-sm font-medium'>{user.name}</span>
          </div>
        </Button>
      </DropdownTrigger>

      <DropdownMenu aria-label='Workspace menu' variant='faded'>
        <DropdownSection showDivider>
          <DropdownItem
            key='profile'
            isReadOnly
            className={cn(
              'cursor-default ring-0 outline-none select-none',
              'hover:bg-transparent focus:bg-transparent focus:ring-0 focus:outline-none',
              'focus-visible:ring-0 focus-visible:outline-none active:bg-transparent',
              'data-[focus-visible=true]:ring-0 data-[focus-visible=true]:outline-none',
              'data-[focus=true]:bg-transparent data-[hover=true]:bg-transparent',
              'data-[pressed=true]:bg-transparent'
            )}
          >
            <HeaderUserProfile user={user} />
          </DropdownItem>
        </DropdownSection>

        <DropdownSection showDivider title={LABEL_THEME}>
          <DropdownItem
            key='theme-light'
            startContent={<SunIcon className='mx-0 h-6 w-6' />}
            onClick={() => handleThemeChange('light')}
            className={cn(currentState.isLight && 'bg-neutral-100 dark:bg-neutral-700')}
          >
            {LABEL_LIGHT}
          </DropdownItem>
          <DropdownItem
            key='theme-dark'
            startContent={<MoonIcon className='mx-1 h-5 w-5' />}
            onClick={() => handleThemeChange('dark')}
            className={cn(currentState.isDark && 'bg-neutral-100 dark:bg-neutral-700')}
          >
            {LABEL_DARK}
          </DropdownItem>
        </DropdownSection>

        <DropdownSection>
          <DropdownItem
            key='logout'
            className={cn(
              'text-danger ring-0 outline-none ' +
                'hover:bg-transparent focus:bg-transparent focus:ring-0 focus:outline-none',
              'focus-visible:ring-0 focus-visible:outline-none active:bg-transparent',
              'data-[focus-visible=true]:ring-0 data-[focus-visible=true]:outline-none',
              'data-[focus=true]:bg-transparent data-[hover=true]:bg-transparent',
              'data-[pressed=true]:bg-transparent'
            )}
            classNames={{ title: 'text-base' }}
            color='danger'
            startContent={<ArrowRightStartOnRectangleIcon className='text-danger h-6' />}
            href={authPages.signOut.to}
          >
            {LABEL_LOGOUT}
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}
