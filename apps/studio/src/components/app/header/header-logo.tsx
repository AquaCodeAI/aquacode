import Link from 'next/link';

// App Configuration
const APP_NAME = 'AquaCode';
const HOME_URL = '/';

// UI Labels
const ARIA_LABEL_HOME = 'AquaCode';

const HeaderLogo = () => (
  <Link href={HOME_URL} aria-label={ARIA_LABEL_HOME} className='text-foreground-800 flex items-center gap-1'>
    <span className='text-lg font-bold md:text-2xl'>{APP_NAME}</span>
  </Link>
);

export default HeaderLogo;
