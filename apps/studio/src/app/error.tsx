'use client';

import { Button } from '@/components/ui';

const Error = ({ reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  return (
    <div>
      <div className='flex h-full w-full flex-col'>
        <main className='flex grow flex-col justify-center text-center'>
          <h1 className='text-foreground-800 text-9xl font-bold'>500</h1>
          <div className='flex flex-col items-center gap-2'>
            <h2 className='text-4xl font-bold'>Something went wrong!</h2>
            <p className='text-foreground-600 max-w-md'>
              Sorry, something went wrong on our end. Please try again later.
            </p>
            <Button className='p-5' onPress={() => reset()}>
              Retry
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Error;
