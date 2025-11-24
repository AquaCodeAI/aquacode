import { Avatar } from '@/components/ui';
import type { UserInterface } from '@/interfaces/user-interfaces';
import { WorkspaceModalDetailRow } from './workspace-modal-detail-row';

interface UserDetailViewProps {
  user: UserInterface;
}

// Date Configuration
const DATE_LOCALE = 'en-US';

// Fallback Values
const FALLBACK_CREATED_DATE = '';

export function UserDetailView({ user }: UserDetailViewProps) {
  const displayName = user.name || user.email;
  const formattedCreatedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(DATE_LOCALE)
    : FALLBACK_CREATED_DATE;

  return (
    <div className='space-y-4'>
      <div className='mb-1.5 flex flex-col items-center py-3 text-center'>
        <Avatar radius='full' name={displayName} size='lg' src={user?.avatar} />
        <p className='text-center text-lg font-bold text-neutral-900 dark:text-white'>{displayName}</p>
        <p className='max-w-md text-center text-sm font-normal text-neutral-600 dark:text-white'>{user.email}</p>
      </div>

      <div className='overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-white/20 dark:bg-neutral-800'>
        <WorkspaceModalDetailRow label='Name' value={user.name} isFirst />
        <WorkspaceModalDetailRow label='Email' value={user.email} />
        <WorkspaceModalDetailRow label='User ID' value={user._id} />
        <WorkspaceModalDetailRow label='Created' value={formattedCreatedDate} />
      </div>
    </div>
  );
}
