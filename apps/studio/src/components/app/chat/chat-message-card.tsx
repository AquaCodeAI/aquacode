import { FC } from 'react';
import { Streamdown } from 'streamdown';
import { AnimatedDots } from '@/components/common/animated-dots';
import { IMessageStatus, MessageInterface, MessageRol } from '@/interfaces/message-interfaces';
import { AquaToolBlock, parseAquaTools } from '@/utils/parse-aqua-tools';
import { ChatMessageTool } from './chat-message-tool';

interface MessageItemProps {
  message: MessageInterface;
}

const UserMessage: FC<{ content: string }> = ({ content }) => (
  <div className='group flex flex-col pr-2 pb-4'>
    <div className='flex flex-col items-end'>
      <div className='max-w-[80%] overflow-x-hidden rounded-xl bg-neutral-200/60 px-3 py-3 text-lg leading-[22px] break-words whitespace-pre-wrap md:text-base dark:bg-neutral-700/50'>
        {content}
      </div>
    </div>
  </div>
);

const ThinkSection: FC<{ blocks: AquaToolBlock[] }> = ({ blocks }) => (
  <>
    {blocks.map((block, index) => (
      <div key={block.id || `think-${index}`} className='text-base whitespace-normal'>
        <Streamdown>{block.content}</Streamdown>
      </div>
    ))}
  </>
);

const ToolSection: FC<{ blocks: AquaToolBlock[]; prefix: string }> = ({ blocks, prefix }) => (
  <>
    {blocks.map((block, index) => (
      <ChatMessageTool key={block.id || `${prefix}-${index}`} tool={block} />
    ))}
  </>
);

const SummarySection: FC<{ blocks: AquaToolBlock[] }> = ({ blocks }) => (
  <>
    {blocks.map((block, index) => (
      <div key={block.id || `summary-${index}`} className='text-base whitespace-normal'>
        <Streamdown>{block.content}</Streamdown>
      </div>
    ))}
  </>
);

export const ChatMessageCard: FC<MessageItemProps> = ({ message }) => {
  if (message.role === MessageRol.USER) {
    return <UserMessage content={message.content} />;
  }

  const contentResult = parseAquaTools(message.content);
  const isLoading = message.status === IMessageStatus.IN_PROGRESS;
  const { sections } = contentResult;

  return (
    <div className='group flex flex-col pb-4'>
      <div className='mb-3 min-w-0 px-5'>
        <div className='flex min-w-0 flex-col space-y-4 text-left text-base leading-[22px] break-words whitespace-normal'>
          {isLoading && !message.content?.trim() && (
            <div className='text-foreground/70 inline-flex items-center text-sm'>
              <AnimatedDots />
            </div>
          )}

          <ThinkSection blocks={sections.think} />

          <div className='space-y-2'>
            <ToolSection blocks={sections.schemas} prefix='schema' />
            <ToolSection blocks={sections.policies} prefix='policy' />
            <ToolSection blocks={sections.write} prefix='write' />
          </div>

          <SummarySection blocks={sections.summary} />
        </div>
      </div>
    </div>
  );
};
