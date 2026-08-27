/*eslint-disable  @typescript-eslint/no-unused-vars */
// /app/lib/wordpress-converter.ts
import DOMPurify from "dompurify";

export interface WordPressPost {
  ID: string;
  post_title: string;
  post_content: string;
  post_date: string;
  post_excerpt: string;
  featured_image_url: string | null;
  section_name: string;
  post_name: string;
  post_author?: string;
  comment_count?: string;
}

export class WordPressContentConverter {
  /**
   * Main method to convert WordPress content to clean HTML
   */
  static convert(content: string, title?: string): string {
    if (!content) return '';

    try {
      // Step 1: Remove WordPress block comments and shortcodes
      let cleaned = this.removeWordPressMarkup(content);

      // Step 2: Decode HTML entities early
      cleaned = this.decodeEntities(cleaned);

      // Step 3: Normalize line breaks and whitespace
      cleaned = this.normalizeWhitespace(cleaned);

      // Step 4: Handle WordPress embeds and bare URLs
      cleaned = this.handleEmbeds(cleaned);

      // Step 5: Clean WordPress-specific classes/styles
      cleaned = this.cleanWordPressClasses(cleaned);

      // Step 6: Detect and format interview content (Q&A format with quotes)
      cleaned = this.formatInterviewContent(cleaned, title);

      // Step 7: Clean spacing and empty tags
      cleaned = this.cleanSpacing(cleaned);

      // Step 8: Format lists
      cleaned = this.formatLists(cleaned);

      // Step 9: Format headings
      cleaned = this.formatHeadings(cleaned);

      // Step 10: Sanitize HTML
      cleaned = DOMPurify.sanitize(cleaned, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'target', 'rel'],
      });

      return cleaned;
    } catch (error) {
      console.error('Error converting WordPress content:', error);
      return content;
    }
  }

  // ─────────────────────────────────────────────
  // STEP 1 – Remove WordPress block comments and shortcodes
  // ─────────────────────────────────────────────
  private static removeWordPressMarkup(content: string): string {
    return content
      // Remove WordPress block comments (both opening and closing)
      .replace(/<!-- \/?wp:[^\-]*?-->/g, '')
      .replace(/<!-- \/?wp:paragraph[^\-]*?-->/g, '')
      .replace(/<!-- \/?wp:list[^\-]*?-->/g, '')
      .replace(/<!-- \/?wp:heading[^\-]*?-->/g, '')
      .replace(/<!--.*?-->/gs, '') // Remove any other HTML comments
      
      // Remove FreshFramework shortcodes
      .replace(/\[\/?ffb[^\]]*\]/g, '')
      
      // Remove any other WordPress shortcodes
      .replace(/\[\/?[a-z_]+[^\]]*\]/gi, '')
      
      // Clean up any leftover empty lines from removed comments
      .replace(/^\s*[\r\n]/gm, '');
  }

  // ─────────────────────────────────────────────
  // STEP 2 – Decode HTML entities
  // ─────────────────────────────────────────────
  private static decodeEntities(content: string): string {
    return content
      .replace(/&amp;/g, '&')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#8217;/g, '\u2019') // Right single quote
      .replace(/&#8216;/g, '\u2018') // Left single quote
      .replace(/&#8220;/g, '\u201C') // Left double quote
      .replace(/&#8221;/g, '\u201D') // Right double quote
      .replace(/&#8211;/g, '\u2013') // En dash
      .replace(/&#8212;/g, '\u2014') // Em dash
      .replace(/&#038;/g, '&')
      .replace(/&hellip;/g, '…')
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'");
  }

  // ─────────────────────────────────────────────
  // STEP 3 – Normalize whitespace
  // ─────────────────────────────────────────────
  private static normalizeWhitespace(content: string): string {
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s+\n/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // ─────────────────────────────────────────────
  // STEP 4 – Handle embeds & bare URLs
  // ─────────────────────────────────────────────
  private static handleEmbeds(content: string): string {
    let processed = content;

    // YouTube youtu.be
    processed = processed.replace(
      /(?<!href=["'])https:\/\/youtu\.be\/([a-zA-Z0-9_-]+)(?:[^\s<>"']*)/g,
      (_match, videoId) =>
        `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
    );

    // YouTube watch?v=
    processed = processed.replace(
      /(?<!href=["'])https:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)(?:[^\s<>"']*)/g,
      (_match, videoId) =>
        `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
    );

    // Wrap bare social/web URLs that are NOT already inside an <a> tag
    processed = processed.replace(
      /(?<!href=["'])(?<!src=["'])(https?:\/\/[^\s<>"'\)]+)/g,
      (match) =>
        `<a href="${match}" target="_blank" rel="noopener noreferrer" class="wordpress-link">${match}</a>`
    );

    // Wrap bare email addresses
    processed = processed.replace(
      /(?<!href=["'])([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g,
      (match) => `<a href="mailto:${match}" class="wordpress-link">${match}</a>`
    );

    return processed;
  }

  // ─────────────────────────────────────────────
  // STEP 5 – Strip WP classes & styles
  // ─────────────────────────────────────────────
  private static cleanWordPressClasses(content: string): string {
    let cleaned = content;
    cleaned = cleaned.replace(/\s*class="wp-block-[^"]*"/g, '');
    cleaned = cleaned.replace(/\s*class="has-[^"]*"/g, '');
    cleaned = cleaned.replace(/\s*class="align[^"]*"/g, '');
    cleaned = cleaned.replace(/\s*class="size-[^"]*"/g, '');
    cleaned = cleaned.replace(/\s*style="[^"]*"/g, '');
    return cleaned;
  }

  // ─────────────────────────────────────────────
  // STEP 6 – Format interview content (Q&A with quotes)
  // ─────────────────────────────────────────────
  private static formatInterviewContent(content: string, title?: string): string {
    let formatted = content;

  

    // Format the intro paragraph (first paragraph with interviewee description)
    formatted = this.formatInterviewIntro(formatted);

    // Format quotes with "Quote –" prefix
    formatted = this.formatPrefixedQuotes(formatted);

    // Format Q&A pairs with numbered questions
    formatted = this.formatQuestionAnswerPairs(formatted);

    // Format any remaining quotes
    formatted = this.formatStandaloneQuotes(formatted);

    return formatted;
  }

  // ─────────────────────────────────────────────
  // Format interview intro paragraph
  // ─────────────────────────────────────────────
  private static formatInterviewIntro(content: string, ): string {
    // Look for the first paragraph that introduces the interviewee
    const paragraphs = content.match(/<p>(.*?)<\/p>/g);
    
    if (paragraphs && paragraphs.length > 0) {
      // Check if the first paragraph contains introduction text
      const firstPara = paragraphs[0];
      if (firstPara.includes('joined by') || firstPara.includes('Founder') || firstPara.includes('Design Head')) {
        return content.replace(firstPara, `<div class="interview-intro">${firstPara}</div>`);
      }
    }
    
    return content;
  }

  // ─────────────────────────────────────────────
  // Format quotes with "Quote –" prefix
  // ─────────────────────────────────────────────
  private static formatPrefixedQuotes(content: string): string {
    // Pattern: "Quote –" followed by quoted text
    const quotePattern = /<p>\s*Quote\s*[–\-—]\s*[“"]([^"”]+)[”"]\s*<\/p>/gi;
    
    return content.replace(quotePattern, (match, quoteText) => {
      return this.buildQuote(quoteText.trim());
    });
  }

  // ─────────────────────────────────────────────
  // Format Q&A pairs
  // ─────────────────────────────────────────────
  private static formatQuestionAnswerPairs(content: string): string {
    let formatted = content;
    
    // Pattern: Numbered questions (e.g., "1. What sparked your interest...")
    formatted = formatted.replace(
      /<p>\s*(\d+)[\s\.\)]\s*(.*?)<\/p>\s*<p>(.*?)<\/p>(?=\s*<p>\s*(?:\d+|\d+\.|<\/p>|$))/gs,
      (match, num, question, answer) => {
        return this.buildQAPair(question.trim(), answer.trim());
      }
    );

    // Pattern: Questions that might have multiple answer paragraphs
    const questionRegex = /<p>\s*(\d+)[\s\.\)]\s*(.*?)<\/p>/g;
    let lastIndex = 0;
    let result = '';
    const  matches = [];

    // Collect all questions with their positions
    let match;
    while ((match = questionRegex.exec(formatted)) !== null) {
      matches.push({
        num: match[1],
        question: match[2],
        index: match.index,
        endIndex: match.index + match[0].length
      });
    }

    // Build result with Q&A pairs
    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const currentMatch = matches[i];
        const nextMatch = matches[i + 1];
        
        // Add text before this question
        result += formatted.substring(lastIndex, currentMatch.index);
        
        // Find answer paragraphs (all paragraphs until next question or end)
        const startPos = currentMatch.endIndex;
        const endPos = nextMatch ? nextMatch.index : formatted.length;
        const answerContent = formatted.substring(startPos, endPos)
          .replace(/<\/?p>/g, '') // Remove paragraph tags
          .trim();
        
        // Build Q&A pair
        result += this.buildQAPair(currentMatch.question, answerContent);
        
        lastIndex = endPos;
      }
      
      // Add remaining content
      result += formatted.substring(lastIndex);
      formatted = result;
    }

    return formatted;
  }

  // ─────────────────────────────────────────────
  // Format standalone quotes (not prefixed with "Quote –")
  // ─────────────────────────────────────────────
  private static formatStandaloneQuotes(content: string): string {
    let formatted = content;

    // Pattern: Quoted text with attribution
    formatted = formatted.replace(
      /<p>\s*[“"]([^"”]{20,})[”"]\s*[—–]\s*([^<]+)<\/p>/gi,
      (_match, quote, attribution) => {
        return this.buildQuote(quote.trim(), attribution.trim());
      }
    );

    // Pattern: Standalone quotes (just quoted text)
    formatted = formatted.replace(
      /<p>\s*[“"]([^"”]{20,})[”"]\s*<\/p>/gi,
      (_match, quote) => {
        return this.buildQuote(quote.trim());
      }
    );

    // Pattern: Quotes in italics
    formatted = formatted.replace(
      /<p>\s*<em>\s*[“"]([^"”]{20,})[”"]\s*<\/em>\s*<\/p>/gi,
      (_match, quote) => {
        return this.buildQuote(quote.trim(), undefined, true);
      }
    );

    return formatted;
  }

  // ─────────────────────────────────────────────
  // Build Q&A pair HTML
  // ─────────────────────────────────────────────
  private static buildQAPair(question: string, answer: string): string {
    // Clean question (remove any remaining HTML)
    const cleanQuestion = question.replace(/<[^>]+>/g, '').trim();
    
    // Clean answer and split into paragraphs if needed
    const cleanAnswer = answer.replace(/<[^>]+>/g, '').trim();
    const answerParagraphs = cleanAnswer.split('\n\n').filter(p => p.trim());
    
    const answerHtml = answerParagraphs.length > 0
      ? answerParagraphs.map(p => `<p>${p}</p>`).join('')
      : `<p>${cleanAnswer}</p>`;

    return `
<div class="interview-question">
  <h3>${cleanQuestion}</h3>
</div>
<div class="interview-answer">
  ${answerHtml}
</div>`;
  }

  // ─────────────────────────────────────────────
  // Build quote HTML
  // ─────────────────────────────────────────────
  private static buildQuote(quote: string, attribution?: string, italic: boolean = false): string {
    const quoteContent = italic ? `<em>“${quote}”</em>` : `“${quote}”`;
    const attributionHtml = attribution ? `<cite>— ${attribution}</cite>` : '';

    return `
<figure class="wp-block-quote">
  <blockquote>
    <p>${quoteContent}</p>
    ${attributionHtml}
  </blockquote>
</figure>`;
  }

  // ─────────────────────────────────────────────
  // STEP 7 – Clean spacing
  // ─────────────────────────────────────────────
  private static cleanSpacing(content: string): string {
    let cleaned = content;

    // Remove empty paragraphs
    cleaned = cleaned.replace(/<p[^>]*>\s*(&nbsp;)?\s*<\/p>/gi, '');

    // Remove empty divs
    cleaned = cleaned.replace(/<div[^>]*>\s*<\/div>/gi, '');

    // Collapse multiple newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    // Ensure proper spacing between interview sections
    cleaned = cleaned.replace(
      /<\/div>\s*\n\s*<div class="interview-/g,
      '</div>\n<div class="interview-'
    );

    return cleaned;
  }

  // ─────────────────────────────────────────────
  // STEP 8 – Format lists
  // ─────────────────────────────────────────────
  private static formatLists(content: string): string {
    let formatted = content;
    formatted = formatted.replace(/<ul[^>]*>/g, '<ul>');
    formatted = formatted.replace(/<ol[^>]*>/g, '<ol>');
    formatted = formatted.replace(/<li[^>]*>/g, '<li>');
    return formatted;
  }

  // ─────────────────────────────────────────────
  // STEP 9 – Format headings
  // ─────────────────────────────────────────────
  private static formatHeadings(content: string): string {
    let formatted = content;
    // Demote h1 → h2 (page title is h1)
    formatted = formatted.replace(/<h1[^>]*>/gi, '<h2>');
    formatted = formatted.replace(/<\/h1>/gi, '</h2>');
    // Strip classes from headings
    formatted = formatted.replace(/<(h[2-6])[^>]*>/gi, '<$1>');
    return formatted;
  }

  // ─────────────────────────────────────────────
  // Public utility methods
  // ─────────────────────────────────────────────

  static extractExcerpt(content: string, maxLength = 200): string {
    if (!content) return '';
    
    // First, try to find a good excerpt (first non-empty paragraph after intro)
    const introMatch = content.match(/<div class="interview-intro">(.*?)<\/div>/);
    if (introMatch) {
      const text = introMatch[1]
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength).trim() + '…';
    }

    // Fallback: first paragraph
    const pMatch = content.match(/<p>(.*?)<\/p>/);
    if (pMatch) {
      const text = pMatch[1]
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength).trim() + '…';
    }

    // Final fallback: strip all HTML
    const text = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '…';
  }

  static extractInterviewee(title: string): string {
    if (!title) return 'Interviewee';
    
    // Pattern: "Entrechat With Tanya Aggarwal"
    const match = title.match(/Entrechat\s+(?:with|With)\s+(.+)/i);
    if (match) {
      return match[1]
        .replace(/^(Ms\.|Mr\.|Mrs\.|Dr\.|Prof\.)\s+/i, '')
        .replace(/&amp;/g, '&')
        .trim();
    }

    return title
      .replace(/Entrechat\s*/i, '')
      .replace(/^(Ms\.|Mr\.|Mrs\.|Dr\.|Prof\.)\s+/i, '')
      .replace(/&amp;/g, '&')
      .trim() || 'Interviewee';
  }

  static categorizePost(content: string, title: string): string {
    if (!content && !title) return 'Entrepreneurship';
    const text = `${title} ${content}`.toLowerCase();

    const categories = [
      { 
        keywords: ['interior design', 'design head', 'space', 'decor', 'architecture', 'aesthetic'], 
        name: 'Interior Design' 
      },
      { 
        keywords: ['fitness', 'nutrition', 'health', 'wellness', 'workout', 'diet', 'yoga'], 
        name: 'Health & Fitness' 
      },
      { 
        keywords: ['travel', 'tourism', 'wanderer', 'destination', 'tour', 'footprint'], 
        name: 'Travel & Tourism' 
      },
      { 
        keywords: ['fashion', 'design', 'boutique', 'jewellery', 'handicraft', 'artisan', 'craft'], 
        name: 'Fashion & Design' 
      },
      { 
        keywords: ['media', 'content', 'storytelling', 'film', 'picture', 'studio'], 
        name: 'Media & Entertainment' 
      },
      { 
        keywords: ['education', 'school', 'communication', 'learning', 'student', 'teacher'], 
        name: 'Education' 
      },
      { 
        keywords: ['technology', 'tech', 'digital', 'platform', 'software', 'app'], 
        name: 'Technology' 
      },
      { 
        keywords: ['social', 'ngo', 'foundation', 'nonprofit', 'community', 'empowerment'], 
        name: 'Social Impact' 
      },
      { 
        keywords: ['food', 'baking', 'culinary', 'kitchen', 'dessert', 'restaurant'], 
        name: 'Food & Beverage' 
      },
    ];

    for (const category of categories) {
      if (category.keywords.some((kw) => text.includes(kw))) return category.name;
    }
    
    return 'Entrepreneurship';
  }

  static calculateReadTime(content: string): string {
    if (!content) return '1 min read';
    const text = content.replace(/<[^>]*>/g, ' ');
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));
    return `${minutes} min read`;
  }

  static formatDate(dateString: string): string {
    if (!dateString) return 'Date unavailable';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date unavailable';
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return 'Date unavailable';
    }
  }

  static getInterviewer(content: string): string {
    // Look for interviewer name in the content
    const patterns = [
      /(?:with|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(?:on|in|&ndash;|–|—)/,
      /(?:as told to|interview by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
      /joined by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) return match[1];
    }

    return 'SheAtWork';
  }

  /**
   * Extract the main quote from content (useful for displaying as pull quote)
   */
  static extractMainQuote(content: string): string | null {
    // Look for quotes with "Quote –" prefix first
    const quoteMatch = content.match(/Quote\s*[–\-—]\s*[“"]([^"”]+)[”"]/i);
    if (quoteMatch) return quoteMatch[1];

    // Then look for any substantial quote
    const quotes = content.match(/[“"]([^"”]{30,})[”"]/g);
    if (quotes && quotes.length > 0) {
      return quotes[0].replace(/[“"]/g, '');
    }

    return null;
  }
}