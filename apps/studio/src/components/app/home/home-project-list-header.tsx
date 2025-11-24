interface HomeProjectListHeaderProps {
  title: string;
  subtitle: string;
  totalCount: number;
}

const HomeProjectListHeader = ({ title, subtitle, totalCount }: HomeProjectListHeaderProps) => (
  <div className='mb-2 md:mb-3'>
    <h2 className='text-foreground text-xl font-semibold md:text-2xl'>
      {title} {totalCount > 0 && `(${totalCount})`}
    </h2>
    <p className='text-foreground/60 mt-0.5 text-sm md:text-base'>{subtitle}</p>
  </div>
);

export default HomeProjectListHeader;
