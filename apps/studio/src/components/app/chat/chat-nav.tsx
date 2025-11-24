'use client';

import ChatNavDropdown from '@/components/app/chat/chat-nav-dropdown';
import ProjectSkeleton from '@/components/app/chat/chat-nav-skeleton';
import { ProjectInterface } from '@/interfaces/project.interfaces';

export interface InnerChatNavProps {
  project?: ProjectInterface;
}

export default function ChatNav({ project }: InnerChatNavProps) {
  return (
    <nav className='relative hidden w-full shrink-0 items-center px-3 py-1 md:flex md:py-2'>
      <div className='w-full'>{!project ? <ProjectSkeleton /> : <ChatNavDropdown project={project} />}</div>
    </nav>
  );
}
