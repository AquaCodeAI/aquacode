import Link from 'next/link';
import { authPages } from '@/configurations/pages';

// UI Labels
const LABEL_LOGIN = 'Log in';

const HeaderLoginButton = () => (
  <Link
    type='link'
    color='primary'
    className='text-foreground rounded-md border border-current p-2 transition-all duration-150 hover:rounded-none md:p-2.5'
    href={authPages.signIn.to}
  >
    <span className='text-lg font-light'>{LABEL_LOGIN}</span>
  </Link>
);

export default HeaderLoginButton;
