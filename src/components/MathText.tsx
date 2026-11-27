import React from "react";
import ReactMarkdown from "react-markdown";
import { mathRemarkPlugins, mathRehypePlugins, normalizeMathInText } from "../lib/mathFormatter";

interface MathTextProps {
  content: string;
  className?: string;
}

export function MathText({ content, className = "" }: MathTextProps) {
  if (!content) return null;

  return (
    <span className={`inline-block ${className}`}>
      <ReactMarkdown
        remarkPlugins={mathRemarkPlugins}
        rehypePlugins={mathRehypePlugins}
        components={{
          p: ({ children }) => <span className="inline">{children}</span>,
        }}
      >
        {normalizeMathInText(content)}
      </ReactMarkdown>
    </span>
  );
}

export default MathText;
