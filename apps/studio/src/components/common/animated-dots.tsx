import { FC } from 'react';

export const AnimatedDots: FC = () => {
  return (
    <span className='inline-flex gap-1'>
      <span
        className='text-lg will-change-transform'
        style={{
          animation: 'dot-bounce 1.2s ease-in-out infinite',
          animationDelay: '-0.0s',
          display: 'inline-block',
        }}
      >
        .
      </span>
      <span
        className='text-lg will-change-transform'
        style={{
          animation: 'dot-bounce 1.2s ease-in-out infinite',
          animationDelay: '-0.4s',
          display: 'inline-block',
        }}
      >
        .
      </span>
      <span
        className='text-lg will-change-transform'
        style={{
          animation: 'dot-bounce 1.2s ease-in-out infinite',
          animationDelay: '-0.8s',
          display: 'inline-block',
        }}
      >
        .
      </span>
    </span>
  );
};
