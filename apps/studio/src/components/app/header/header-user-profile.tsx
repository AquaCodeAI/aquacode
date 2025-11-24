import { Avatar } from '@/components/ui';
import type { UserInterface } from '@/interfaces/user-interfaces';

interface HeaderUserProfileProps {
  user: UserInterface;
}

// Fallback Values
const FALLBACK_USER_NAME = '';

const HeaderUserProfile = ({ user }: HeaderUserProfileProps) => {
  const displayName = user.name || FALLBACK_USER_NAME;

  return (
    <div className='flex items-center gap-3 select-none'>
      <Avatar radius='sm' name={displayName} size='md' src={user.avatar} />
      <div className='flex flex-col select-none'>
        <span className='text-base font-medium select-none'>{user.name}</span>
        <span className='text-foreground/65 text-sm select-none'>{user.email}</span>
      </div>
    </div>
  );
};

export default HeaderUserProfile;
