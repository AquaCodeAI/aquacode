import { EmojiAvatar } from '@/components/common/emoji-avatar';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import { WorkspaceModalBase } from './workspace-modal-base';
import { WorkspaceModalDetailRow } from './workspace-modal-detail-row';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInterface;
}

export function ProjectSettingsModal({ isOpen, onClose, project }: ProjectSettingsModalProps) {
  return (
    <WorkspaceModalBase isOpen={isOpen} onClose={onClose} title='Project Settings'>
      <div className='mb-1.5 flex flex-col items-center py-3 text-center'>
        <EmojiAvatar seed={project.name} size={100} />
        <p className='pt-5 text-center text-lg font-bold text-neutral-900 dark:text-white'>{project?.name}</p>
        <p className='max-w-md text-center text-sm font-normal text-neutral-600 dark:text-neutral-400'>
          {project?.description || 'Project Description'}
        </p>
      </div>
      <div className='overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-white/20 dark:bg-neutral-800'>
        <WorkspaceModalDetailRow label='Name' value={project?.name || ''} isFirst />
        <WorkspaceModalDetailRow label='Description' value={project?.description || ''} />
        <WorkspaceModalDetailRow label='Domain' value={project?.domain || ''} />
        <WorkspaceModalDetailRow label='Project ID' value={project?._id || ''} />
        <WorkspaceModalDetailRow
          label='Creation'
          value={project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : ''}
        />
      </div>
    </WorkspaceModalBase>
  );
}
