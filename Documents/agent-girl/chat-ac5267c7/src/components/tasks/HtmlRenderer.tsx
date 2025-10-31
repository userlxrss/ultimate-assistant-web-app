import React from 'react';
import { sanitizeHtml, htmlToPlainText, isSafeHtml } from '../../utils/htmlSanitizer';

interface HtmlRendererProps {
  html: string;
  className?: string;
  maxLines?: number;
  showAsPlainText?: boolean;
}

/**
 * HtmlRenderer - Safely renders HTML content with proper styling
 *
 * Features:
 * - HTML sanitization to prevent XSS
 * - Proper CSS styling for common HTML elements
 * - Fallback to plain text if HTML is unsafe
 * - Line clamping for long content
 */
const HtmlRenderer: React.FC<HtmlRendererProps> = ({
  html,
  className = '',
  maxLines,
  showAsPlainText = false
}) => {
  if (!html || typeof html !== 'string') {
    return <span className={className}>No description available</span>;
  }

  // If plain text is requested or HTML is unsafe, show as formatted plain text
  if (showAsPlainText || !isSafeHtml(html)) {
    const plainText = htmlToPlainText(html);
    return (
      <div
        className={`whitespace-pre-wrap ${className}`}
        style={{
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          ...(maxLines ? {} : { display: 'block' })
        }}
      >
        {plainText}
      </div>
    );
  }

  // Safe HTML rendering
  const sanitizedHtml = sanitizeHtml(html);

  return (
    <div
      className={`task-description prose prose-sm max-w-none ${className}`}
      style={{
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        ...(maxLines ? {} : { display: 'block' })
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default HtmlRenderer;