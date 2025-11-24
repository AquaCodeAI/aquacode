import type { NextPage } from 'next';
import HomeHero from '@/components/app/home/home-hero';
import HomeProjectList from '@/components/app/home/home-project-list';
import HomeStartChat from '@/components/app/home/home-start-chat';

const Page: NextPage = () => {
  return (
    <main className='overflow-hidden'>
      <section className='flex flex-col items-center justify-center py-[14vh] 2xl:py-52'>
        <HomeHero title="Let's build your app step by step" subtitle='From idea to an app with AI' />
        <HomeStartChat />
        <HomeProjectList />
      </section>
    </main>
  );
};

export default Page;
