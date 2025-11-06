/**
 * HTML Sanitizer and Renderer Utilities
 *
 * These utilities provide safe HTML rendering for task descriptions
 * with proper sanitization to prevent XSS attacks.
 */

// Basic HTML sanitization - removes dangerous tags and attributes
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    // Remove dangerous tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<input\b[^<]*>/gi, '')
    .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
    // Remove dangerous attributes
    .replace(/on\w+="[^"]*"/gi, '') // Event handlers
    .replace(/on\w+='[^']*'/gi, '') // Event handlers (single quotes)
    .replace(/javascript:/gi, '') // JavaScript protocol
    .replace(/vbscript:/gi, '') // VBScript protocol
    .replace(/data:/gi, '') // Data protocol (except for images)
    // Keep safe data URLs for images
    .replace(/data:image\/(png|jpg|jpeg|gif|webp);base64,[a-zA-Z0-9+/=]+/g, (match) => match);
};

// Convert HTML to plain text with better formatting
export const htmlToPlainText = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let text = html
    // Convert <p> to paragraphs with line breaks
    .replace(/<\/p><p>/g, '\n\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n\n')
    // Convert <br> to line breaks
    .replace(/<br\s*\/?>/g, '\n')
    // Convert <strong> and <b> to bold indicator
    .replace(/<(?:strong|b)>/g, '**')
    .replace(/<\/(?:strong|b)>/g, '**')
    // Convert <em> and <i> to italic indicator
    .replace(/<(?:em|i)>/g, '*')
    .replace(/<\/(?:em|i)>/g, '*')
    // Convert headers
    .replace(/<h[1-6]>/g, '\n## ')
    .replace(/<\/h[1-6]>/g, '\n')
    // Convert lists
    .replace(/<li>/g, '• ')
    .replace(/<\/li>/g, '\n')
    .replace(/<\/?ul>/g, '')
    .replace(/<\/?ol>/g, '')
    // Convert <hr> to separator
    .replace(/<hr\s*\/?>/g, '\n---\n')
    // Remove all other HTML tags
    .replace(/<[^>]+>/g, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{3,}/g, '  ')
    .trim();

  return text;
};

// Check if HTML content is safe to render
export const isSafeHtml = (html: string): boolean => {
  if (!html || typeof html !== 'string') {
    return true;
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(html));
};

// Extract plain text from HTML for previews
export const extractTextFromHtml = (html: string, maxLength: number = 100): string => {
  const text = htmlToPlainText(html);
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};