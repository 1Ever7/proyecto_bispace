export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const sanitizeForLog = (data: any): any => {
  if (typeof data === 'string') {
    return data.replace(/\n/g, '\\n').replace(/\t/g, '\\t');
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = Array.isArray(data) ? [] : {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitized[key] = sanitizeForLog(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
};