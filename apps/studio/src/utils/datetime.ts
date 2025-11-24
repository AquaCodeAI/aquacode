export const relativeTime = (_date?: Date | string | number): string => {
  if (!_date) return '';

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const date = new Date(_date);
  const now = new Date();

  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);

  if (Math.abs(diffInSeconds) < 60) {
    return rtf.format(diffInSeconds, 'seconds');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (Math.abs(diffInMinutes) < 60) {
    return rtf.format(diffInMinutes, 'minutes');
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (Math.abs(diffInHours) < 24) {
    return rtf.format(diffInHours, 'hours');
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (Math.abs(diffInDays) < 30) {
    return rtf.format(diffInDays, 'days');
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (Math.abs(diffInMonths) < 12) {
    return rtf.format(diffInMonths, 'months');
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return rtf.format(diffInYears, 'years');
};

export const relativeTimeShort = (_date?: Date | string | number): string => {
  if (!_date) return '';

  const now = new Date();
  const date = new Date(_date);

  if (isNaN(date.getTime())) return '';

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // future
  if (diffMs < 0) {
    const absDiffSeconds = Math.abs(diffSeconds);
    const absDiffMinutes = Math.abs(diffMinutes);
    const absDiffHours = Math.abs(diffHours);
    const absDiffDays = Math.abs(diffDays);

    if (absDiffSeconds < 60) return 'ahora';
    if (absDiffMinutes < 60) return `en ${absDiffMinutes} min`;
    if (absDiffHours < 24) return `en ${absDiffHours} h`;
    if (absDiffDays < 7) return `en ${absDiffDays} d`;
    return `en ${Math.floor(absDiffDays / 7)} sem`;
  }

  // past
  if (diffSeconds < 60) return 'ahora';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  if (diffHours < 24) return `${diffHours} h`;
  if (diffDays < 7) return `${diffDays} d`;
  if (diffWeeks < 4) return `${diffWeeks} sem`;
  if (diffMonths < 12) return `${diffMonths} m`;
  return `${diffYears}a`;
};
