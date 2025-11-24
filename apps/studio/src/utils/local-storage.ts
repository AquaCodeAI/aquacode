export const setLocalStorageItem = <T>(key: string, value?: T): boolean => {
  try {
    if (value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch {
    return false;
  }
};

export const getLocalStorageItem = <T>(key: string, defaultValue?: T) => {
  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue) as T;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

export const deleteLocalStorageItem = (key: string): boolean => {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};
