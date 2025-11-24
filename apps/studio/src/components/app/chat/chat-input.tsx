'use client';

import React, { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import ChatInputTextArea from '@/components/app/chat/chat-input-text-area';
import { ChatInputTextareaSkeleton } from '@/components/app/chat/chat-input-textarea-skeleton';
import { usePostEditorStore } from '@/hooks/use-post-editor-store';
import type { ProjectInterface } from '@/interfaces/project.interfaces';
import { IMessageStatus, type MessageInterface, MessageRol } from '@/interfaces/message-interfaces';
import type { ItemResponseInterface } from '@/interfaces/response-interfaces';
import type { DeploymentInterface } from '@/interfaces/deployment-interfaces';
import { generateULID } from '@/utils/id-generator';
import { parseSSEStream, streamClient } from '@/utils/stream-client';
import { fetchClient, FetchClientError } from '@/utils/fetch-client';

// Message ID Prefixes
const USER_MESSAGE_ID_PREFIX = 'umsg';
const AI_MESSAGE_ID_PREFIX = 'aimsg';

// Error Messages
const ERROR_CHAT_START_FAILED = 'Chat could not be started. Please try again.';
const ERROR_CHAT_RECONNECT_FAILED = 'Chat could not be reconnected. Please try again.';
const ERROR_UNEXPECTED = 'An unexpected error has occurred.';

export interface ChatInputProps {
  project?: ProjectInterface;
  messages?: MessageInterface[];
  setMessages: Dispatch<SetStateAction<MessageInterface[]>>;
  isMessagesLoading: boolean;
  currentIframePath?: string;
  selectedDeployment: DeploymentInterface | null;
}

export default function ChatInput({
  project,
  messages,
  setMessages,
  isMessagesLoading,
  currentIframePath,
  selectedDeployment,
}: ChatInputProps) {
  // Chat State
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeUserMessageId, setActiveUserMessageId] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  // Hydration State
  const [isClientMounted, setIsClientMounted] = useState(false);

  // Store State
  const pendingMessage = usePostEditorStore((s) => s.message);
  const selectedModelId = usePostEditorStore((s) => s.modelId);
  const setSelectedModelId = usePostEditorStore((s) => s.setModelId);
  const clearPendingMessage = usePostEditorStore((s) => s.clearMessage);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Auto-start chat for new conversation
  useEffect(() => {
    if (!project) return;
    if (isMessagesLoading) return;
    if (messages && messages.length > 0) return;
    if (pendingMessage.trim().length > 0 && selectedModelId) {
      setInputValue('');
      startNewChat(pendingMessage.trim(), selectedModelId).then(() => {
        clearPendingMessage();
      });
    }
  }, [project, isMessagesLoading, messages, pendingMessage, clearPendingMessage]);

  // Auto-recovery for interrupted chat
  useEffect(() => {
    if (!project) return;
    if (isStreaming) return;
    if (isMessagesLoading) return;
    if (!messages || messages.length < 2) return;

    const lastMessageIndex = messages.length - 1;
    const lastAiMessage = messages[lastMessageIndex];
    const lastUserMessage = messages[lastMessageIndex - 1];

    const isAiMessageIncomplete =
      lastAiMessage.role === MessageRol.AI && lastAiMessage.status === IMessageStatus.IN_PROGRESS;

    const isUserMessageComplete = lastUserMessage.role === MessageRol.USER;

    if (isAiMessageIncomplete && isUserMessageComplete) {
      reconnectChat(lastUserMessage._id, lastAiMessage._id).then();
    }
  }, [project, isMessagesLoading, messages, isStreaming]);

  const startNewChat = useCallback(
    async (userMessage: string, aiModelId: string) => {
      if (!project) return;
      if (isStreaming) return;

      setIsStreaming(true);

      const userMessageId = generateULID(USER_MESSAGE_ID_PREFIX);
      setActiveUserMessageId(userMessageId);

      const aiMessageId = generateULID(AI_MESSAGE_ID_PREFIX);

      // Add a user message
      setMessages((prev) => [
        ...prev,
        {
          _id: userMessageId,
          role: MessageRol.USER,
          content: userMessage,
          status: IMessageStatus.COMPLETED,
        },
      ]);

      try {
        const url = `/v1/chat`;
        const response = await streamClient(url, {
          method: 'POST',
          body: {
            message: userMessage,
            projectId: project._id,
            currentRoute: currentIframePath,
            userMessageId,
            aiMessageId,
            aiModelId,
          },
        });

        if (!response) {
          setIsStreaming(false);
          return;
        }

        // Prepare AI message container
        setMessages((prev) => [
          ...prev,
          {
            _id: aiMessageId,
            role: MessageRol.AI,
            content: '',
            status: IMessageStatus.IN_PROGRESS,
          },
        ]);

        for await (const sseEvent of parseSSEStream<MessageInterface>(response)) {
          if (sseEvent.eventName === 'message' && sseEvent.eventData) {
            setMessages((prev) => {
              const incomingMessage = sseEvent.eventData;
              const incomingMessageId = incomingMessage._id;

              const existingMessageIndex = prev.findIndex((m) => m._id === incomingMessageId);
              if (existingMessageIndex !== -1) {
                const updatedMessages = [...prev];
                updatedMessages[existingMessageIndex] = {
                  ...updatedMessages[existingMessageIndex],
                  ...incomingMessage,
                  _id: incomingMessageId,
                  status: IMessageStatus.IN_PROGRESS,
                };
                return updatedMessages;
              }

              const incomingContent = (incomingMessage.content ?? '').trim();
              const isDuplicateMessage = prev.some(
                (m) => m.role === (incomingMessage.role ?? MessageRol.AI) && m.content.trim() === incomingContent
              );
              if (isDuplicateMessage) return prev;

              return [
                ...prev,
                {
                  _id: incomingMessageId,
                  role: incomingMessage.role ?? MessageRol.AI,
                  content: incomingMessage.content ?? '',
                  status: IMessageStatus.IN_PROGRESS,
                },
              ];
            });
          }
        }
      } catch (error) {
        if (error instanceof FetchClientError && error.response?.data) {
          const responseData = error.response.data as ItemResponseInterface<ProjectInterface>;
          if (responseData.errors && responseData.errors.length > 0) {
            setChatError(responseData.errors.join(', '));
          } else {
            setChatError(ERROR_CHAT_START_FAILED);
          }
        } else {
          setChatError(ERROR_UNEXPECTED);
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m._id === aiMessageId ? { ...m, status: IMessageStatus.COMPLETED } : m))
        );

        setIsStreaming(false);
        setActiveUserMessageId(null);
      }
    },
    [project, isStreaming, currentIframePath, setMessages]
  );

  const reconnectChat = useCallback(
    async (userMessageId: string, aiMessageId: string) => {
      if (!project) return;
      if (isStreaming) return;

      setIsStreaming(true);
      setActiveUserMessageId(userMessageId);

      try {
        const url = `/v1/chat/${userMessageId}`;
        const response = await streamClient(url, {
          method: 'GET',
        });

        if (!response) {
          setIsStreaming(false);
          return;
        }

        for await (const sseEvent of parseSSEStream<MessageInterface>(response)) {
          if (sseEvent.eventName === 'message' && sseEvent.eventData) {
            setMessages((prev) => {
              const incomingMessage = sseEvent.eventData;
              const existingMessageIndex = prev.findIndex((m) => m._id === incomingMessage._id);

              if (existingMessageIndex !== -1) {
                const updatedMessages = [...prev];
                updatedMessages[existingMessageIndex] = {
                  ...updatedMessages[existingMessageIndex],
                  ...incomingMessage,
                  status: IMessageStatus.IN_PROGRESS,
                };
                return updatedMessages;
              }

              const isDuplicateMessage = prev.some(
                (m) => m.role === incomingMessage.role && m.content.trim() === (incomingMessage.content ?? '').trim()
              );
              if (isDuplicateMessage) return prev;

              return [...prev, { ...incomingMessage, status: IMessageStatus.IN_PROGRESS }];
            });
          }
        }
      } catch (error) {
        if (error instanceof FetchClientError && error.response?.data) {
          const responseData = error.response.data as ItemResponseInterface<ProjectInterface>;
          if (responseData.errors && responseData.errors.length > 0) {
            setChatError(responseData.errors.join(', '));
          } else {
            setChatError(ERROR_CHAT_RECONNECT_FAILED);
          }
        } else {
          setChatError(ERROR_UNEXPECTED);
        }
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m._id === aiMessageId ? { ...m, status: IMessageStatus.COMPLETED } : m))
        );
        setIsStreaming(false);
        setActiveUserMessageId(null);
      }
    },
    [project, isStreaming, setMessages]
  );

  const cancelChat = useCallback(
    async (userMessageId: string) => {
      if (!project) return;
      if (!isStreaming) return;

      try {
        const url = `/v1/chat/${userMessageId}`;
        await fetchClient<Response>({ url, method: 'DELETE' });
      } catch {
        // Silent error handling for cancellation
      }

      setIsStreaming(false);
      setActiveUserMessageId(null);
    },
    [project, isStreaming]
  );

  const handleSubmitMessage = useCallback(() => {
    const trimmedPrompt = inputValue.trim();
    if (!trimmedPrompt) return;

    startNewChat(trimmedPrompt, selectedModelId).then();
    setInputValue('');
  }, [inputValue, startNewChat]);

  const hasMessages = messages && messages.length > 0;

  return (
    <div className='flex max-h-[calc(100%-37px)] shrink-0 flex-col'>
      <div className='group relative mb-2 flex flex-col gap-2 rounded-3xl border border-black/15 p-5 pt-2 transition-colors duration-150 ease-in-out dark:border-white/20 dark:bg-neutral-800'>
        {isClientMounted && hasMessages ? (
          <ChatInputTextArea
            prompt={inputValue}
            onPromptChange={setInputValue}
            selectedModel={selectedModelId}
            setSelectedModel={setSelectedModelId}
            onSubmitPrompt={handleSubmitMessage}
            isOnStreaming={isStreaming}
            isViewingDeployment={!!selectedDeployment}
            onCancelGeneration={() => cancelChat(activeUserMessageId || '')}
            errorMessage={chatError}
          />
        ) : (
          <ChatInputTextareaSkeleton />
        )}
      </div>
    </div>
  );
}
