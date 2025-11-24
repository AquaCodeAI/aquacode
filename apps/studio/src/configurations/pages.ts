export const appPaths = {
  to: '/',
  projects: {
    to: '/projects',
    details: {
      to: (id: string | number) => `/projects/${id}`,
    },
  },
};

export const authPages = {
  signIn: {
    to: '/signin',
  },
  signOut: {
    to: '/signout',
  },
};
