import React from 'react';

// Utility function to safely render any value as string
export const safeRender = (value: any, fallback: string = 'N/A'): string => {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    // If it's an object with a name property, use that
    if (value.name && typeof value.name === 'string') {
      return value.name;
    }
    // If it's an object with id property, use that
    if (value.id && typeof value.id === 'string') {
      return value.id;
    }
    // If it's an object with title property, use that
    if (value.title && typeof value.title === 'string') {
      return value.title;
    }
    // If it's an object with label property, use that
    if (value.label && typeof value.label === 'string') {
      return value.label;
    }
    // Otherwise stringify the object, but keep it readable
    try {
      const jsonStr = JSON.stringify(value);
      return jsonStr.length > 50 ? jsonStr.substring(0, 47) + '...' : jsonStr;
    } catch {
      return '[Complex Object]';
    }
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? `[${value.length} items]` : '[]';
  }
  return fallback;
};

// Export a React-safe version that returns JSX elements
export const SafeRender: React.FC<{ value: any; fallback?: string; className?: string }> = ({
  value,
  fallback = 'N/A',
  className = ''
}) => {
  const rendered = safeRender(value, fallback);
  return <span className={className}>{rendered}</span>;
};