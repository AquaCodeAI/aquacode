'use client';

import { Button } from '@/components/ui';

const NotFoundPage = () => {
  const onRetry = () => {
    window.location.reload();
  };
  return (
    <div className='flex h-full w-full grow flex-col'>
      <main className='flex grow flex-col justify-center text-center'>
        <h1 className='text-foreground-800 text-9xl font-bold'>404</h1>
        <div className='flex flex-col items-center gap-2'>
          <h2 className='text-4xl font-bold'>Page Not Found</h2>
          <p className='text-foreground-600 max-w-md'>
            Sorry, what you are looking for is not available. Please check the URL or try again.
          </p>
          <Button className='p-5' onPress={onRetry}>
            Retry
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
