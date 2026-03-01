"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
        ),
        li: ({ children }) => <li className="mb-1">{children}</li>,
        ul: ({ children }) => (
          <ul className="list-disc ml-4 mb-3 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal ml-4 mb-3 space-y-1">{children}</ol>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline underline-offset-2 hover:text-accent-hover"
          >
            {children}
          </a>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <pre className="bg-code-bg rounded-lg p-3 my-3 overflow-x-auto text-xs font-mono leading-relaxed border border-border">
              <code>{children}</code>
            </pre>
          ) : (
            <code className="bg-code-bg border border-border rounded px-1.5 py-0.5 text-[13px] font-mono">
              {children}
            </code>
          );
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-accent pl-3 my-3 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
