import { ReactNode } from 'react';
import { Button } from '@/components/ui';

interface NavButtonProps {
  title: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  position?: 'start' | 'end';
}

const WorkspaceNavButton = ({ title, icon, onClick, disabled, isLoading, position = 'end' }: NavButtonProps) => (
  <Button
    size='xs'
    variant='bordered'
    title={title}
    radius='full'
    className='text-neutral flex items-center gap-2 border border-neutral-200 p-4 font-normal capitalize disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/20 dark:bg-neutral-800'
    {...(position === 'start' ? { startContent: icon } : { endContent: icon })}
    onClick={onClick}
    disabled={disabled}
    isLoading={isLoading}
  >
    {isLoading ? `${title}...` : title}
  </Button>
);

export default WorkspaceNavButton;
