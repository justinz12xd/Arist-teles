"use client";

import { ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownAnswer({ content }: { content: string }) {
  return (
    <div className="chat-answer max-w-[72ch] text-[0.9375rem] leading-7 text-[var(--primary-80)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="mt-6 text-xl font-medium text-white first:mt-0">{children}</h2>,
          h2: ({ children }) => <h3 className="mt-6 text-lg font-medium text-white first:mt-0">{children}</h3>,
          h3: ({ children }) => <h4 className="mt-5 text-base font-medium text-white first:mt-0">{children}</h4>,
          p: ({ children }) => <p className="mt-4 first:mt-0">{children}</p>,
          ul: ({ children }) => <ul className="mt-4 list-disc space-y-1.5 pl-5 marker:text-[var(--accent-gold)]">{children}</ul>,
          ol: ({ children }) => <ol className="mt-4 list-decimal space-y-1.5 pl-5 marker:text-[var(--accent-gold)]">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline items-center text-[var(--accent-gold)] underline decoration-[rgb(216_177_95/0.35)] underline-offset-4 transition-colors hover:text-[var(--accent-marble)]"
            >
              {children} <ExternalLink aria-hidden className="inline-block size-3 align-[-0.1em]" />
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = Boolean(className?.includes("language-"));
            return isBlock ? (
              <code className="block min-w-max px-4 py-3 font-mono text-xs leading-6 text-[#e8dfcc]">{children}</code>
            ) : (
              <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[0.82em] text-[#e8dfcc]">{children}</code>
            );
          },
          pre: ({ children }) => (
            <pre className="scrollbar-hidden mt-4 max-w-full overflow-x-auto rounded-xl border border-white/10 bg-black/40">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-4 border-l border-[rgb(216_177_95/0.55)] pl-4 text-[var(--primary-60)]">{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
