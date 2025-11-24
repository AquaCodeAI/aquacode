import { ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@/components/ui';
import { ProjectInterface } from '@/interfaces/project.interfaces';

interface ChatNavDropdownProps {
  project: ProjectInterface;
}

export default function ChatNavDropdown({ project }: ChatNavDropdownProps) {
  return (
    <Dropdown className='flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200'>
      <DropdownTrigger>
        <Button
          endContent={<ChevronDownIcon className='h-3 w-3' />}
          className='flex items-center gap-2 text-black capitalize dark:text-white'
          variant='light'
        >
          <span className='truncate text-base font-normal'>{project.name}</span>
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label='Project options' variant='light'>
        <DropdownItem key='home' href='/' startContent={<ChevronLeftIcon className='h-5 w-5' />}>
          Go to Dashboard
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
