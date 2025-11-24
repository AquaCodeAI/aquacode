import React from 'react';
import { MessageInterface } from '@/interfaces/message-interfaces';
import { ChatMessageCard } from '@/components/app/chat/chat-message-card';
import { ArrowDownIcon } from '@heroicons/react/24/outline';

interface InnerChatContentMessageListProps {
  messages: MessageInterface[];
  errorMessage: string | null;
  isVisible: boolean;
  onClick: () => void;
}

const ErrorState = ({ message }: { message: string }) => (
  <div className='flex h-full flex-col items-center justify-center px-4 pb-40'>
    <div className='w-full max-w-md'>
      <div className='mb-4 text-center'>
        <h3 className='text-foreground mb-1 text-lg font-medium'>Something went wrong</h3>
        <p className='text-foreground/60 text-sm'>An error occurred while loading messages</p>
      </div>
      <div className='text-foreground/80 mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900/40 dark:bg-red-950/30'>
        {message}
      </div>
    </div>
  </div>
);

const ScrollToBottomButton = ({ onClick }: { onClick: () => void }) => (
  <div className='pointer-events-none absolute inset-x-0 bottom-0 mb-4 flex w-full items-center justify-center'>
    <button
      onClick={onClick}
      className='pointer-events-auto z-10 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-black transition-all duration-200 ease-in-out hover:bg-neutral-50 dark:border-white/20 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700'
      aria-label='Scroll to bottom'
      type='button'
    >
      <ArrowDownIcon className='h-4 w-4 stroke-[3]' />
    </button>
  </div>
);

export default function ChatMessageList({
  messages,
  errorMessage,
  isVisible,
  onClick,
}: InnerChatContentMessageListProps) {
  if (errorMessage) {
    return <ErrorState message={errorMessage} />;
  }

  return (
    <>
      <div className='group flex flex-col gap-4 pr-2 pb-4'>
        {messages.map((message) => (
          <ChatMessageCard key={message._id} message={message} />
        ))}
      </div>
      {isVisible && <ScrollToBottomButton onClick={onClick} />}
    </>
  );
}
