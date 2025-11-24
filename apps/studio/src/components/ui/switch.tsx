'use client';

import { Switch as HeroUISwitch } from '@heroui/switch';
import { extendVariants } from '@heroui/system';

export const Switch = extendVariants(HeroUISwitch, {
  defaultVariants: {
    color: 'primary',
  },
});
