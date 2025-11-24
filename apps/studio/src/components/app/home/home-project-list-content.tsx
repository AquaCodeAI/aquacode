import type { ProjectInterface } from '@/interfaces/project.interfaces';
import HomeProjectListCard from './home-project-list-card';

interface HomeProjectListContentProps {
  projects: ProjectInterface[];
  errorMessage?: string | null;
}
// UI Messages
const MESSAGE_NO_PROJECTS = "You don't have any projects yet, create one to start.";

const HomeProjectListContentEmptyState = ({ message }: { message: string }) => (
  <div className='text-foreground/80 rounded-xl border border-black/10 p-4 text-sm dark:border-white/10 dark:text-white/80'>
    {message}
  </div>
);

export default function HomeProjectListContent({ projects, errorMessage }: HomeProjectListContentProps) {
  if (errorMessage) {
    return <HomeProjectListContentEmptyState message={errorMessage} />;
  }

  if (projects.length === 0) {
    return <HomeProjectListContentEmptyState message={MESSAGE_NO_PROJECTS} />;
  }

  return (
    <ul className='grid grid-cols-1 gap-3 md:grid-cols-2'>
      {projects.map((project) => (
        <HomeProjectListCard key={project._id} project={project} />
      ))}
    </ul>
  );
}
