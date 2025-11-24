interface HomeHeroProps {
  title: string;
  subtitle: string;
}

export default function HomeHero({ title, subtitle }: HomeHeroProps) {
  return (
    <div className='mb-4 flex flex-col items-center px-4 text-center md:mb-6'>
      <h1 className='text-foreground mb-2 text-2xl leading-tight font-medium tracking-tight sm:text-3xl md:text-5xl'>
        {title}
      </h1>
      <p className='text-foreground/65 max-w-[25ch] text-lg leading-tight md:max-w-full md:text-xl'>{subtitle}</p>
    </div>
  );
}
