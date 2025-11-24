import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui';

interface ModalHeaderNavProps {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export function WorkspaceModalHeader({
  title,
  onClose,
  onBack,
  onForward,
  canGoBack = false,
  canGoForward = false,
}: ModalHeaderNavProps) {
  return (
    <div className='flex w-full items-center justify-between'>
      <div className='flex items-center gap-1.5'>
        <div className='flex'>
          <Button
            size='xs'
            variant='light'
            radius='full'
            className='rounded-md p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
            onPress={onBack}
            isDisabled={!canGoBack}
          >
            <ChevronLeftIcon className='h-6 w-6 text-gray-600' />
          </Button>
          <Button
            size='xs'
            variant='light'
            radius='full'
            className='rounded-md p-1.5 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'
            onPress={onForward}
            isDisabled={!canGoForward}
          >
            <ChevronRightIcon className='h-6 w-6 text-gray-600' />
          </Button>
        </div>
        <div className='flex-1 text-center'>
          <span className='text-base font-semibold'>{title}</span>
        </div>
      </div>
      <Button
        size='xs'
        variant='light'
        radius='full'
        className='rounded-md p-2 transition-colors hover:bg-gray-100'
        onPress={onClose}
      >
        <XMarkIcon className='h-6 w-6 text-gray-600' />
      </Button>
    </div>
  );
}
