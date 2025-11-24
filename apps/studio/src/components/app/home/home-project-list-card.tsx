'use client';

import Link from 'next/link';
import { EmojiAvatar } from '@/components/common/emoji-avatar';
import { appPaths } from '@/configurations/pages';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import { relativeTime } from '@/utils/datetime';

interface HomeProjectListCardProps {
  project: ProjectInterface;
}

const HomeProjectListCardAvatar = ({ project }: HomeProjectListCardProps) => (
  <div className='flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/5 text-2xl md:h-16 md:w-16 md:text-3xl dark:bg-white/10'>
    <EmojiAvatar seed={project.name} />
  </div>
);

const HomeProjectListCardInfo = ({ project }: HomeProjectListCardProps) => (
  <div className='min-w-0'>
    <h3 className='text-foreground truncate text-[15px] font-semibold md:text-base'>{project.name}</h3>
    <p className='text-foreground/80 mt-0.5 line-clamp-3 text-[13px] leading-snug md:text-[15px]'>
      {project?.description ?? 'No description provided.'}
    </p>
    <p className='text-foreground/60 mt-1 text-xs md:text-sm'>Last activity · {relativeTime(project.updatedAt)}</p>
  </div>
);

const HomeProjectListCard = ({ project }: HomeProjectListCardProps) => (
  <li>
    <article className='group relative rounded-2xl p-2.5 transition-colors focus-within:bg-black/5 hover:bg-black/5 dark:focus-within:bg-white/5 dark:hover:bg-white/5'>
      <Link
        href={appPaths.projects.details.to(project._id)}
        className='absolute inset-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/30'
      />
      <div className='flex items-center gap-3'>
        <HomeProjectListCardAvatar project={project} />
        <HomeProjectListCardInfo project={project} />
      </div>
    </article>
  </li>
);

export default HomeProjectListCard;
