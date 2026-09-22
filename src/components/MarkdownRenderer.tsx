import React, { Component, ErrorInfo, ReactNode } from "react";

interface MarkdownRendererProps {
  content?: string;
  className?: string;
}

interface ErrorBoundaryProps {
  content: string;
  className?: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * React Error Boundary that catches any rendering exceptions
 * and falls back to displaying the raw markdown text gracefully.
 */
class MarkdownErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("MarkdownRenderer encountered a rendering error, falling back to raw markdown:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={`whitespace-pre-wrap font-sans text-charcoal-800 text-sm sm:text-base leading-relaxed ${this.props.className || ""}`}>
          {this.props.content}
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Renders inline markdown tokens (bold, italic, code, links) safely as React nodes.
 * Falls back to raw text if token parsing encounters an exception.
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  try {
    // Regex splitting on markdown tokens:
    // **bold**, *italic*, `code`, [text](url)
    const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Bold: **text**
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={index} className="font-bold text-charcoal-900">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic: *text*
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return (
          <em key={index} className="italic text-charcoal-800">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Inline Code: `text`
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code
            key={index}
            className="bg-petal-100 text-forest-900 px-1.5 py-0.5 rounded text-[0.85em] font-mono border border-petal-200"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Link: [label](url)
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (linkMatch) {
        const [, label, rawUrl] = linkMatch;
        const trimmedUrl = rawUrl.trim();
        // Safe scheme validation: allow http, https, mailto, relative paths, anchor links
        const isSafe = /^(https?:\/\/|mailto:|\/|#)/i.test(trimmedUrl);
        if (!isSafe) {
          return <span key={index}>{label}</span>;
        }

        const isExternal = trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://");
        return (
          <a
            key={index}
            href={trimmedUrl}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="text-forest-800 hover:text-forest-900 underline font-medium"
          >
            {label}
          </a>
        );
      }

      return part;
    });
  } catch (err) {
    console.warn("Error parsing inline markdown, falling back to raw line:", err);
    return [text];
  }
}

/**
 * Parses and renders a single block or sub-block of markdown.
 */
function renderBlock(blockText: string, keyPrefix: string | number): React.ReactNode {
  const trimmed = blockText.trim();
  if (!trimmed) return null;

  // Headings: #, ##, ###, ####
  const headingMatch = /^(#{1,4})\s+(.+)$/s.exec(trimmed);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const rest = headingMatch[2];
    const firstNewline = rest.indexOf("\n");
    const headingTitle = firstNewline === -1 ? rest.trim() : rest.slice(0, firstNewline).trim();
    const trailingContent = firstNewline === -1 ? "" : rest.slice(firstNewline + 1).trim();

    let headingElem: React.ReactNode;
    if (level === 1) {
      headingElem = (
        <h1
          key={`${keyPrefix}-h1`}
          className="font-editorial text-3xl sm:text-4xl font-bold text-charcoal-900 pt-6 pb-1 tracking-tight"
        >
          {renderInlineMarkdown(headingTitle)}
        </h1>
      );
    } else if (level === 2) {
      headingElem = (
        <h2
          key={`${keyPrefix}-h2`}
          className="font-editorial text-2xl sm:text-3xl font-bold text-charcoal-900 pt-5 pb-1 tracking-tight"
        >
          {renderInlineMarkdown(headingTitle)}
        </h2>
      );
    } else if (level === 3) {
      headingElem = (
        <h3
          key={`${keyPrefix}-h3`}
          className="font-editorial text-xl sm:text-2xl font-bold text-charcoal-900 pt-4 pb-0.5"
        >
          {renderInlineMarkdown(headingTitle)}
        </h3>
      );
    } else {
      headingElem = (
        <h4
          key={`${keyPrefix}-h4`}
          className="font-editorial text-lg font-bold text-charcoal-900 pt-2"
        >
          {renderInlineMarkdown(headingTitle)}
        </h4>
      );
    }

    if (!trailingContent) {
      return headingElem;
    }

    return (
      <React.Fragment key={keyPrefix}>
        {headingElem}
        {renderBlock(trailingContent, `${keyPrefix}-sub`)}
      </React.Fragment>
    );
  }

  // Horizontal Rule: --- or ***
  if (/^(\-{3,}|\*{3,})$/.test(trimmed)) {
    return <hr key={keyPrefix} className="border-petal-200 my-6" />;
  }

  // Blockquote: > text
  if (trimmed.startsWith(">")) {
    const quoteLines = trimmed
      .split("\n")
      .map((l) => l.replace(/^>\s*/, ""))
      .join(" ");
    return (
      <blockquote
        key={keyPrefix}
        className="border-l-4 border-forest-600/70 bg-petal-50/80 px-4 py-3 rounded-r-2xl text-charcoal-700 italic font-editorial text-base my-3"
      >
        {renderInlineMarkdown(quoteLines)}
      </blockquote>
    );
  }

  // Bullet List: lines starting with - or *
  const lines = trimmed.split("\n");
  const isBulletList = lines.every((l) => /^\s*[-*]\s+/.test(l));
  if (isBulletList && lines.length > 0) {
    return (
      <ul key={keyPrefix} className="space-y-2 pl-2 my-2">
        {lines.map((item, itemIdx) => {
          const itemText = item.replace(/^\s*[-*]\s+/, "");
          return (
            <li key={itemIdx} className="flex items-start space-x-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-700 mt-2 shrink-0" />
              <span className="text-charcoal-700 leading-relaxed">
                {renderInlineMarkdown(itemText)}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  // Numbered List: lines starting with 1. 2. etc.
  const isNumberedList = lines.every((l) => /^\s*\d+\.\s+/.test(l));
  if (isNumberedList && lines.length > 0) {
    return (
      <ol key={keyPrefix} className="space-y-2 pl-2 my-2">
        {lines.map((item, itemIdx) => {
          const numberMatch = /^\s*(\d+)\.\s+(.*)$/.exec(item);
          const num = numberMatch ? numberMatch[1] : String(itemIdx + 1);
          const itemText = numberMatch ? numberMatch[2] : item;
          return (
            <li key={itemIdx} className="flex items-start space-x-2.5">
              <span className="font-bold text-xs text-forest-800 bg-forest-50 border border-forest-100 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                {num}
              </span>
              <span className="text-charcoal-700 leading-relaxed">
                {renderInlineMarkdown(itemText)}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  // Standard paragraph with line break support
  return (
    <p key={keyPrefix} className="text-charcoal-700 leading-relaxed">
      {lines.map((line, lineIdx) => (
        <React.Fragment key={lineIdx}>
          {lineIdx > 0 && <br />}
          {renderInlineMarkdown(line)}
        </React.Fragment>
      ))}
    </p>
  );
}

/**
 * Inner parser that handles block-level Markdown structures.
 */
function MarkdownContent({ content, className = "" }: { content: string; className?: string }) {
  try {
    // Split into block paragraphs separated by double newlines or multiple newlines
    const rawBlocks = content.split(/\n\n+/);

    return (
      <div className={`space-y-5 text-charcoal-800 text-sm sm:text-base leading-relaxed ${className}`}>
        {rawBlocks.map((block, blockIdx) => renderBlock(block, blockIdx))}
      </div>
    );
  } catch (err) {
    console.warn("MarkdownRenderer encountered block parse error, falling back to raw markdown:", err);
    return (
      <div className={`whitespace-pre-wrap font-sans text-charcoal-800 text-sm sm:text-base leading-relaxed ${className}`}>
        {content}
      </div>
    );
  }
}

/**
 * Lightweight, failsafe Markdown renderer formatted to Moitrii's editorial aesthetic.
 * Wrapped in dual-layer try-catch and React ErrorBoundary: if any parsing or rendering exception
 * occurs, it falls back cleanly to displaying the raw markdown without crashing the page.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content = "",
  className = "",
}) => {
  if (!content || typeof content !== "string") {
    return null;
  }

  return (
    <MarkdownErrorBoundary content={content} className={className}>
      <MarkdownContent content={content} className={className} />
    </MarkdownErrorBoundary>
  );
};

export default MarkdownRenderer;
