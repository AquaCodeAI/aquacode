import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = async ({ children }: LayoutProps) => {
  return (
    <div className='text-lg text-[#727F94]'>
      <div className='flex min-h-screen items-center justify-center bg-[#fefefe] px-4'>
        <div className='w-full max-w-md'>
          <div className='rounded-lg pt-8 pr-6 pb-8 pl-6'>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
