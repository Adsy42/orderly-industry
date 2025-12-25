"use client";

import "./markdown-styles.css";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { FC, memo, useState } from "react";
import { CheckIcon, CopyIcon, FileText, ExternalLink } from "lucide-react";
import { SyntaxHighlighter } from "@/components/thread/syntax-highlighter";

import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { useParams } from "next/navigation";

import "katex/dist/katex.min.css";

interface CodeHeaderProps {
  language?: string;
  code: string;
}

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };

  return { isCopied, copyToClipboard };
};

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-t-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
      <span className="lowercase [&>span]:text-xs">{language}</span>
      <TooltipIconButton
        tooltip="Copy"
        onClick={onCopy}
      >
        {!isCopied && <CopyIcon />}
        {isCopied && <CheckIcon />}
      </TooltipIconButton>
    </div>
  );
};

/**
 * Citation link component for rendering cite: protocol links.
 * Extracts the citation text, document ID, and chunk ID to create clickable links
 * with preview tooltips showing the exact cited passage.
 */
interface InlineCitationProps {
  href: string;
  children: React.ReactNode;
  matterId?: string;
}

const InlineCitation: FC<InlineCitationProps> = ({
  href,
  children,
  matterId,
}) => {
  // Extract document ID and chunk ID from cite:document-id#chunk-id format
  const citePart = href.replace("cite:", "");
  const [documentId, chunkId] = citePart.split("#");
  const citationText = String(children);

  // State for chunk content preview
  const [chunkContent, setChunkContent] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Build the document link with chunk highlight parameter
  const documentLink = matterId
    ? `/protected/matters/${matterId}/documents/${documentId}${chunkId ? `?highlight=${chunkId}` : ""}`
    : `/protected/documents/${documentId}${chunkId ? `?highlight=${chunkId}` : ""}`;

  // Fetch chunk content for preview on hover
  const fetchChunkPreview = async () => {
    if (!chunkId || chunkContent !== null) return;

    setIsLoadingPreview(true);
    try {
      const response = await fetch(
        `/api/citations/${documentId}?chunkId=${chunkId}`,
      );
      if (response.ok) {
        const data = await response.json();
        // API returns 'preview' field with truncated chunk content
        setChunkContent(data.preview || null);
      }
    } catch (err) {
      console.error("Failed to fetch chunk preview:", err);
      setChunkContent(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Preview text is already truncated by API
  const previewText = chunkContent;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Link
            href={documentLink}
            onMouseEnter={fetchChunkPreview}
            className={cn(
              "inline-flex items-center gap-1",
              "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300",
              "text-sm font-medium",
              "underline decoration-dotted underline-offset-2 hover:decoration-solid",
              "-mx-0.5 rounded px-0.5 transition-colors",
              "hover:bg-blue-50 dark:hover:bg-blue-950/30",
            )}
          >
            <FileText className="h-3 w-3 shrink-0" />
            <span>{citationText}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-sm border bg-white p-3 shadow-lg dark:bg-gray-900"
        >
          {isLoadingPreview ? (
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Loading preview...</span>
            </div>
          ) : previewText ? (
            <div className="space-y-2">
              <p className="text-xs leading-relaxed text-gray-700 italic dark:text-gray-300">
                &ldquo;{previewText}&rdquo;
              </p>
              <div className="text-muted-foreground flex items-center gap-1 border-t pt-2 text-xs">
                <ExternalLink className="h-3 w-3" />
                <span>Click to view in document</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <ExternalLink className="h-3 w-3" />
              <span>Click to view source document</span>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const defaultComponents: any = {
  h1: ({ className, ...props }: { className?: string }) => (
    <h1
      className={cn(
        "mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }: { className?: string }) => (
    <h2
      className={cn(
        "mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: { className?: string }) => (
    <h3
      className={cn(
        "mt-6 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }: { className?: string }) => (
    <h4
      className={cn(
        "mt-6 mb-4 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h5: ({ className, ...props }: { className?: string }) => (
    <h5
      className={cn(
        "my-4 text-lg font-semibold first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h6: ({ className, ...props }: { className?: string }) => (
    <h6
      className={cn("my-4 font-semibold first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }: { className?: string }) => (
    <p
      className={cn("mt-5 mb-5 leading-7 first:mt-0 last:mb-0", className)}
      {...props}
    />
  ),
  // Note: 'a' links are handled specially in MarkdownTextImpl to support cite: protocol
  blockquote: ({ className, ...props }: { className?: string }) => (
    <blockquote
      className={cn("border-l-2 pl-6 italic", className)}
      {...props}
    />
  ),
  ul: ({ className, ...props }: { className?: string }) => (
    <ul
      className={cn("my-5 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }: { className?: string }) => (
    <ol
      className={cn("my-5 ml-6 list-decimal [&>li]:mt-2", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }: { className?: string }) => (
    <hr
      className={cn("my-5 border-b", className)}
      {...props}
    />
  ),
  table: ({ className, ...props }: { className?: string }) => (
    <table
      className={cn(
        "my-5 w-full border-separate border-spacing-0 overflow-y-auto",
        className,
      )}
      {...props}
    />
  ),
  th: ({ className, ...props }: { className?: string }) => (
    <th
      className={cn(
        "bg-muted px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: { className?: string }) => (
    <td
      className={cn(
        "border-b border-l px-4 py-2 text-left last:border-r [&[align=center]]:text-center [&[align=right]]:text-right",
        className,
      )}
      {...props}
    />
  ),
  tr: ({ className, ...props }: { className?: string }) => (
    <tr
      className={cn(
        "m-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg",
        className,
      )}
      {...props}
    />
  ),
  sup: ({ className, ...props }: { className?: string }) => (
    <sup
      className={cn("[&>a]:text-xs [&>a]:no-underline", className)}
      {...props}
    />
  ),
  pre: ({ className, ...props }: { className?: string }) => (
    <pre
      className={cn(
        "max-w-4xl overflow-x-auto rounded-lg bg-black text-white",
        className,
      )}
      {...props}
    />
  ),
  code: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => {
    const match = /language-(\w+)/.exec(className || "");

    if (match) {
      const language = match[1];
      const code = String(children).replace(/\n$/, "");

      return (
        <>
          <CodeHeader
            language={language}
            code={code}
          />
          <SyntaxHighlighter
            language={language}
            className={className}
          >
            {code}
          </SyntaxHighlighter>
        </>
      );
    }

    return (
      <code
        className={cn("rounded font-semibold", className)}
        {...props}
      >
        {children}
      </code>
    );
  },
};

const MarkdownTextImpl: FC<{ children: string }> = ({ children }) => {
  // Get matter ID from URL params if available
  const params = useParams();
  const matterId = params?.matterId as string | undefined;

  // Create components with citation link support
  const componentsWithCitations = {
    ...defaultComponents,
    a: ({
      href,
      children: linkChildren,
      className,
      ...props
    }: {
      href?: string;
      children?: React.ReactNode;
      className?: string;
    }) => {
      // Check if this is a citation link (cite: protocol)
      if (href?.startsWith("cite:")) {
        return (
          <InlineCitation
            href={href}
            matterId={matterId}
          >
            {linkChildren}
          </InlineCitation>
        );
      }

      // Regular link
      return (
        <a
          href={href}
          className={cn(
            "text-primary font-medium underline underline-offset-4",
            className,
          )}
          target={href?.startsWith("http") ? "_blank" : undefined}
          rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
          {...props}
        >
          {linkChildren}
        </a>
      );
    },
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={componentsWithCitations}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const MarkdownText = memo(MarkdownTextImpl);
