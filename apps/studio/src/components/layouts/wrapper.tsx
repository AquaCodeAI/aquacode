'use client';

import { FC, ReactNode } from 'react';

interface IWrapperProps {
  children: ReactNode;
}

export const Wrapper: FC<IWrapperProps> = (props) => {
  const { children, ...rest } = props;

  return (
    <main data-component-name='Wrapper' {...rest}>
      {children}
    </main>
  );
};
