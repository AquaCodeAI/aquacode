// Skeleton Display Configuration
const SKELETON_PROJECT_CARDS_COUNT = 6;

const HomeProjectListSkeleton = () => {
  return (
    <>
      <div className='mb-2 md:mb-3'>
        <div className='h-8 w-44 animate-pulse rounded-lg bg-black/5 dark:bg-white/5' />
        <div className='mt-2 h-6 w-60 animate-pulse rounded-lg bg-black/5 dark:bg-white/5' />
      </div>
      <ul className='grid grid-cols-1 gap-3 md:grid-cols-2' aria-busy='true'>
        {Array.from({ length: SKELETON_PROJECT_CARDS_COUNT }).map((_, index) => (
          <li key={index} className='animate-pulse'>
            <article className='h-20 rounded-2xl bg-black/5 p-2.5 md:h-24 dark:bg-white/5' />
          </li>
        ))}
      </ul>
    </>
  );
};

export default HomeProjectListSkeleton;
