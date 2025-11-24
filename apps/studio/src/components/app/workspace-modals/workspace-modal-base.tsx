import { ReactNode } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader } from '@/components/ui';
import { WorkspaceModalHeader } from './workspace-modal-header';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onBack?: () => void;
  onForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export function WorkspaceModalBase({
  isOpen,
  onClose,
  title,
  children,
  onBack,
  onForward,
  canGoBack,
  canGoForward,
}: BaseModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size='lg'
      height='static-lg'
      hideCloseButton={true}
      className='bg-neutral-50 dark:bg-neutral-800'
      backdrop='blur'
      classNames={{
        backdrop: 'backdrop-blur-[0.08rem] bg-neutral-800/15',
      }}
    >
      <ModalContent>
        <ModalHeader className='px-0 py-0'>
          <WorkspaceModalHeader
            title={title}
            onClose={onClose}
            onBack={onBack}
            onForward={onForward}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
          />
        </ModalHeader>
        <ModalBody className='scroll max-h-[70vh] overflow-y-auto px-3 py-3'>{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
}
