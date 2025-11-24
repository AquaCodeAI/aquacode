import { type ReactNode } from 'react';
import { Aside } from '@/components/layouts/aside';
import { Footer } from '@/components/layouts/footer';
import { Header } from '@/components/layouts/header';
import { Wrapper } from '@/components/layouts/wrapper';
import { PostEditorStoreProvider } from '@/contexts/post-editor-store-context';

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <PostEditorStoreProvider>
      <Header />
      <Aside />
      <Wrapper>{children}</Wrapper>
      <Footer />
    </PostEditorStoreProvider>
  );
};

export default Layout;
