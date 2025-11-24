import { Roboto_Flex } from 'next/font/google';

export const fontSans = Roboto_Flex({
  display: 'swap',
  preload: true,
  style: ['normal'],
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-sans', // Default variable name
});
