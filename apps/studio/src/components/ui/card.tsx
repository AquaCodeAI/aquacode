'use client';

import { Card as NUCard, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { extendVariants } from '@heroui/system';

export const Card = extendVariants(NUCard, {
  defaultVariants: {
    shadow: 'none',
  },
});

export { CardHeader, CardBody, CardFooter };
