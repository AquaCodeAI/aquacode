'use client';

import { Image as HUImage } from '@heroui/image';
import { extendVariants } from '@heroui/system';

export const Image = extendVariants(HUImage, {
  variants: {
    _custom: {
      default: {
        wrapper: 'bg-background-300  max-w-full',
      },
    },
  },
  defaultVariants: {
    _custom: 'default',
  },
});
