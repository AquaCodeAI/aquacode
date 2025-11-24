export const setCookieClient = (
  key: string,
  value: string,
  options: {
    path?: string;
    maxAge?: number;
  } = {}
) => {
  const { path = '/', maxAge = 60 * 60 * 24 * 7 } = options;
  const cookieParts: string[] = [
    `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    `path=${path}`,
    `max-age=${maxAge}`,
  ];

  document.cookie = cookieParts.join('; ');
};

export const deleteCookieClient = (
  key: string,
  options: {
    path?: string;
  } = {}
) => {
  const { path = '/' } = options;
  const cookieParts: string[] = [
    `${encodeURIComponent(key)}=`,
    `path=${path}`,
    `max-age=0`,
    `expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ];

  document.cookie = cookieParts.join('; ');
};
