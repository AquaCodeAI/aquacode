'use client';

import { Modal as HeroUIModal } from '@heroui/modal';
import { extendVariants } from '@heroui/system';

export const Modal = extendVariants(HeroUIModal, {
  variants: {
    color: {
      custom: {
        base: 'dark:bg-background md:p-2',
        backdrop: 'dark:bg-background-500/80',
        closeButton: 'md:top-4 md:right-4! dark:hover:bg-default-900',
        footer: 'md:gap-8',
      },
    },
    size: {
      lg: {
        base: 'max-w-[36.45rem]',
      },
    },
    height: {
      'static-lg': {
        base: 'h-[40rem]',
      },
    },
  },
  defaultVariants: {
    color: 'custom',
    scrollBehavior: 'inside',
  },
});

export { ModalBody, ModalContent, ModalFooter, ModalHeader, useDisclosure, useModalContext } from '@heroui/modal';
