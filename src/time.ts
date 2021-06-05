import parse from 'parse-duration';

// Attempts to parse a time as a duration or ISO 8601 format, returning a unix timestamp
export const parseTimeOrDuration = (timeOrDuration: string): number => {
  // special case: `now` is now
  if (timeOrDuration === 'now') {
    return new Date().getTime();
  }

  // check for ISO 8601 format
  if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(timeOrDuration)) {
    const time = Date.parse(timeOrDuration);
    if (!time) {
      throw new Error(`Unable to parse time as ISO 8601 format: ${timeOrDuration}`);
    }
    return time;
  }

  // otherwise, try to parse as a duration
  const duration = parse(timeOrDuration, 'ms');
  if (!duration) {
    throw new Error(`Unable to parse time as a duration: ${timeOrDuration}`);
  }
  return new Date().getTime() - duration;
};
