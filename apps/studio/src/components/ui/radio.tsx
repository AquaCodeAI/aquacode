'use client';

import { Radio as HeroUIRadio, RadioGroup as HeroUIRadioGroup } from '@heroui/radio';
import { extendVariants } from '@heroui/system';

export const Radio = extendVariants(HeroUIRadio, {
  defaultVariants: {
    size: 'lg',
    variant: 'bordered',
  },
});

export const RadioGroup = extendVariants(HeroUIRadioGroup, {
  defaultVariants: {
    size: 'lg',
    variant: 'bordered',
    labelPlacement: 'outside',
  },
});
