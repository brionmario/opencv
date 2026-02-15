/**
 * HTML Rendering Utilities for CV Templates
 * 
 * Provides safe HTML rendering for CV content with support for
 * both HTML tags and markdown syntax (for backward compatibility).
 */

/**
 * Escapes HTML special characters
 */
function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes and prepares HTML content for safe rendering
 * Supports both HTML tags and markdown syntax
 * 
 * @param str - The HTML or markdown string to sanitize
 * @returns Sanitized HTML safe for rendering
 */
export function sanitizeHtml(str: string): string {
  if (!str) return "";
  
  // Check if content has markdown syntax (**, *, __, _)
  const hasMarkdown = /(\*\*|__|\*|_)/.test(str);
  const hasHtmlTags = /<[^>]+>/.test(str);
  
  // If it has markdown but no HTML, convert markdown to HTML first
  if (hasMarkdown && !hasHtmlTags) {
    // Convert markdown to HTML
    // Bold: **text** or __text__ (process first to avoid conflicts)
    str = str.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    str = str.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_ (process after bold to avoid conflicts)
    // Match single * or _ not preceded/followed by another
    str = str.replace(/([^*]|^)\*([^*]+?)\*([^*]|$)/g, '$1<em>$2</em>$3');
    str = str.replace(/([^_]|^)_([^_]+?)_([^_]|$)/g, '$1<em>$2</em>$3');
  }
  
  // Now process HTML
  const stillHasHtmlTags = /<[^>]+>/.test(str);
  
  if (!stillHasHtmlTags) {
    // Plain text - escape it
    return escapeHtml(str);
  }
  
  // Basic HTML sanitization - allow only specific formatting tags
  // Remove any potentially dangerous tags/attributes
  let sanitized = str
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/<\s*style[^>]*>.*?<\/style>/gi, '');
  
  // Allow only safe formatting tags
  const allowedTags = ['strong', 'em', 'b', 'i', 'u', 'br', 'sup', 'sub', 'a'];
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  
  sanitized = sanitized.replace(tagPattern, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      // Closing tags - keep as is
      if (match.startsWith('</')) {
        return `</${tagName}>`;
      }
      
      // Special handling for anchor tags - preserve href and target attributes
      if (tagName.toLowerCase() === 'a') {
        const hrefMatch = match.match(/href=(["'])([^"']*)\1/i);
        const targetMatch = match.match(/target=(["'])([^"']*)\1/i);
        
        if (hrefMatch) {
          const href = hrefMatch[2];
          // Sanitize href - only allow http, https, and mailto protocols
          if (/^(https?:\/\/|mailto:)/i.test(href)) {
            const targetAttr = targetMatch ? ` target="${escapeHtml(targetMatch[2])}"` : '';
            return `<a href="${escapeHtml(href)}"${targetAttr} class="text-pink-600 hover:text-pink-700 underline">`;
          }
        }
        // If no valid href, strip the tag
        return '';
      }
      
      // Other tags - remove attributes
      return `<${tagName}>`;
    }
    // Escape disallowed tags
    return escapeHtml(match);
  });
  
  return sanitized;
}

/**
 * React component that safely renders HTML content
 * Use this for displaying CV content that may contain HTML formatting
 */
export function HtmlContent({ 
  content, 
  className = "" 
}: { 
  content: string; 
  className?: string;
}) {
  const sanitized = sanitizeHtml(content);
  
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

/**
 * Hook to get sanitized HTML string
 * Useful when you need the HTML string directly
 */
export function useSanitizedHtml(content: string): string {
  return sanitizeHtml(content);
}
