// Markdown with math (KaTeX). Loaded on demand so the formula engine is not part of app startup.
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { mathRemarkPlugins, mathRehypePlugins, normalizeMathInText } from "../lib/mathFormatter";

// inline: đoạn văn render thành <span> thay vì <p>, để đặt được trong <p>/<button>
// mà không sinh lỗi "<p> cannot be a descendant of <p>". [Claude Code 2]
const INLINE_COMPONENTS = {
  p: ({ children }: { children?: ReactNode }) => <span className="block">{children}</span>,
};

export default function MathMarkdown({ text, inline = false }: { text: string; inline?: boolean }) {
  return (
    <ReactMarkdown remarkPlugins={mathRemarkPlugins} rehypePlugins={mathRehypePlugins} components={inline ? INLINE_COMPONENTS : undefined}>
      {normalizeMathInText(text)}
    </ReactMarkdown>
  );
}
