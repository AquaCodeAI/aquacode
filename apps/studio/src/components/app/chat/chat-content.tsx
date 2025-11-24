'use client';

import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import ChatMessageList from '@/components/app/chat/chat-message-list';
import { Spinner } from '@/components/ui';
import { useScrollManager } from '@/hooks/use-scroll-manager';
import type { MessageInterface } from '@/interfaces/message-interfaces';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import type { ListResponseInterface } from '@/interfaces/response-interfaces';
import { FetchClientError, fetchClient } from '@/utils/fetch-client';

export interface InnerChatContentProps {
  project?: ProjectInterface;
  messages: MessageInterface[];
  setMessages: Dispatch<SetStateAction<MessageInterface[]>>;
  isMessagesLoading: boolean;
  setIsMessagesLoading?: (v: boolean) => void;
}

const MESSAGES_PER_PAGE = 250;

export default function ChatContent({
  project,
  messages,
  setMessages,
  isMessagesLoading,
  setIsMessagesLoading,
}: InnerChatContentProps) {
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(
    async (page: number = 1, resetData: boolean = false) => {
      if (!project) return;

      try {
        setError(null);
        setIsMessagesLoading?.(true);

        const { data } = await fetchClient<ListResponseInterface<MessageInterface>>({
          url: `/v1/messages`,
          params: {
            page,
            perPage: MESSAGES_PER_PAGE,
            projectId: project._id,
          },
        });

        const fetchedMessages = data.result.reverse();
        setMessages((prev) => (resetData || page === 1 ? fetchedMessages : [...prev, ...fetchedMessages]));
      } catch (error) {
        if (error instanceof FetchClientError && error.response?.data) {
          const responseData = error.response.data as ListResponseInterface<MessageInterface>;
          if (responseData.errors && responseData.errors.length > 0) {
            setError(responseData.errors.join(', '));
          } else {
            setError('Messages could not be loaded. Please try again.');
          }
        } else {
          setError('An unexpected error has occurred.');
        }
      } finally {
        setIsMessagesLoading?.(false);
      }
    },
    [project, setMessages, setIsMessagesLoading]
  );

  useEffect(() => {
    if (project) {
      fetchMessages(1, true).then();
    }
  }, [project, fetchMessages]);

  const { scrollContainerRef, isNearBottom, scrollToBottom } = useScrollManager({
    bottomThreshold: 35,
  });

  useEffect(() => {
    if (!isMessagesLoading && messages && messages.length > 0 && isNearBottom) {
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
    }
  }, [isMessagesLoading, messages, scrollToBottom, isNearBottom]);

  return (
    <div className='relative flex min-h-0 w-full flex-1 shrink'>
      <div
        className='h-full w-full overflow-x-hidden overflow-y-auto opacity-100 transition-opacity duration-0'
        ref={scrollContainerRef}
      >
        {!project || isMessagesLoading ? (
          <Spinner className='flex h-full items-center justify-center' size='md' />
        ) : (
          <ChatMessageList
            messages={messages}
            errorMessage={error}
            isVisible={!isNearBottom}
            onClick={() => scrollToBottom()}
          />
        )}
      </div>
    </div>
  );
}
