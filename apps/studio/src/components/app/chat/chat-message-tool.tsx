import { FC, ReactNode } from 'react';
import { AquaToolBlock } from '@/utils/parse-aqua-tools';
import { PencilSquareIcon, PuzzlePieceIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

interface InnerChatContentMessageCardToolProps {
  tool: AquaToolBlock;
}

const parseFileData = (jsonContent: string) => {
  try {
    const parsed = JSON.parse(jsonContent.trim());
    if (parsed.file_path && typeof parsed.file_path === 'string') {
      return {
        file_path: parsed.file_path,
        content: parsed.content || '',
      };
    }
    return undefined;
  } catch {
    return undefined;
  }
};

const parseName = (jsonContent: string): string | null => {
  try {
    const parsed = JSON.parse(jsonContent.trim());
    return parsed?.name ?? null;
  } catch {
    return null;
  }
};

const parsePolicyName = (jsonContent: string): string | null => {
  try {
    const parsed = JSON.parse(jsonContent.trim());
    return parsed?.policyName ?? null;
  } catch {
    return null;
  }
};

interface ToolDisplayProps {
  icon: ReactNode;
  completedText: string;
  progressText: string;
  name: string | null;
  isCompleted: boolean;
}

const ToolDisplay: FC<ToolDisplayProps> = ({ icon, completedText, progressText, name, isCompleted }) => (
  <div className='flex items-start gap-3 rounded-lg pb-1'>
    <div className='flex-shrink-0 pt-0.5'>{icon}</div>
    <div className='min-w-0 flex-1'>
      <div className='flex items-center gap-2 text-sm'>
        <span className={cn('font-medium text-neutral-900 dark:text-white', { 'shimmer-text': !isCompleted })}>
          {isCompleted ? completedText : progressText}
        </span>
        <span
          className={cn(
            'inline-block truncate rounded-xl border border-neutral-200 bg-white px-2 font-mono text-neutral-800 md:max-w-[250px] dark:border-white/20 dark:bg-neutral-800 dark:text-white',
            { 'shimmer-text': !isCompleted }
          )}
        >
          {name}
        </span>
      </div>
    </div>
  </div>
);

export const ChatMessageTool: FC<InnerChatContentMessageCardToolProps> = ({ tool }) => {
  switch (tool.name) {
    case 'aqua-schema': {
      const schemaName = parseName(tool.content);

      return (
        <ToolDisplay
          icon={<PuzzlePieceIcon className='h-4 w-4 text-gray-500' />}
          completedText='Updated schema'
          progressText='Updating schema'
          name={schemaName}
          isCompleted={tool.isCompleted}
        />
      );
    }

    case 'aqua-policy': {
      const policyName = parsePolicyName(tool.content);

      return (
        <ToolDisplay
          icon={<ShieldCheckIcon className='h-4 w-4 text-gray-500' />}
          completedText='Updated policy'
          progressText='Updating policy'
          name={policyName}
          isCompleted={tool.isCompleted}
        />
      );
    }

    case 'aqua-write': {
      const fileData = parseFileData(tool.content);
      const fileName = fileData?.file_path?.split('/').pop();

      return (
        <ToolDisplay
          icon={<PencilSquareIcon className='h-4 w-4 text-gray-500' />}
          completedText='Edited file'
          progressText='Editing file'
          name={fileName ?? ''}
          isCompleted={tool.isCompleted}
        />
      );
    }

    default:
      return null;
  }
};
