'use client';

import { Spinner } from '@heroui/spinner';

// UI Messages - Loading State
const MESSAGE_LOADING_TITLE = 'Preparing your development environment';
const MESSAGE_LOADING_DESCRIPTION = 'We are initializing the sandbox for your project. This may take a few seconds...';

// UI Messages - Error State
const MESSAGE_ERROR_TITLE = 'No preview available';
const MESSAGE_ERROR_DESCRIPTION = 'Start chatting to generate your project and see the preview in real-time.';

export function ContentLoadingState() {
  return (
    <div className='flex h-full w-full items-center justify-center'>
      <Spinner size='lg' color='primary' />
    </div>
  );
}

export function ContentQueueState() {
  return (
    <div className='flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center'>
      <div className='flex flex-col gap-2'>
        <h3 className='shimmer-text text-lg font-semibold text-neutral-900 dark:text-white'>{MESSAGE_LOADING_TITLE}</h3>
        <p className='text-sm text-neutral-600 dark:text-neutral-400'>{MESSAGE_LOADING_DESCRIPTION}</p>
      </div>
    </div>
  );
}

export function ContentErrorState() {
  return (
    <div className='flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center'>
      <div className='flex flex-col gap-2'>
        <h3 className='text-lg font-semibold text-neutral-900 dark:text-white'>{MESSAGE_ERROR_TITLE}</h3>
        <p className='text-sm text-neutral-600 dark:text-neutral-400'>{MESSAGE_ERROR_DESCRIPTION}</p>
      </div>
    </div>
  );
}

interface ContentPreviewIframeProps {
  src: string;
}

export function ContentPreviewIframe({ src }: ContentPreviewIframeProps) {
  return (
    <iframe
      src={src}
      className='h-full w-full border-0'
      title='Preview'
      sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads'
    />
  );
}
