'use client';

import { Tooltip as HeroUITooltip, type TooltipProps } from '@heroui/tooltip';

export const Tooltip = ({ children, content, ...props }: TooltipProps) => {
  if (!content) {
    return <>{children}</>;
  }
  return (
    <HeroUITooltip content={content} {...props}>
      {children}
    </HeroUITooltip>
  );
};

export { type TooltipProps } from '@heroui/tooltip';
