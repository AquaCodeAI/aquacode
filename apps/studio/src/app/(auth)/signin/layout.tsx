import type { ReactNode } from 'react';
import Image from 'next/image';

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <div className='xs:pr-10 xs:pl-10 pt-6 pb-8'>
        {/* Logo */}
        <div className='mb-6 flex justify-center'>
          <Image
            src='https://assets.aquacode.ai/acme-inc-isotype.svg'
            alt='Acme Inc'
            width={120}
            height={54}
            className='h-[54px] w-auto'
          />
        </div>

        {/* Title */}
        <h1 className='text-center text-3xl font-bold text-[#0F0E45]'>Log in</h1>
      </div>

      {children}
    </>
  );
};

export default Layout;
