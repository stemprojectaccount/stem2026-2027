import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Render inline LaTeX math ($...$) cleanly using KaTeX, falling back to readable notation
 * so raw "$a^m \cdot a^n = a^{m+n}$" never leaks to the UI.
 */
export function renderTextWithMath(text: string): React.ReactNode {
  if (!text || !text.includes("$")) return text;

  const parts = text.split(/(\$[^$]+\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      const rawFormula = part.slice(1, -1).trim();
      try {
        const html = katex.renderToString(rawFormula, {
          throwOnError: false,
          displayMode: false,
        });
        return (
          <span
            key={index}
            className="inline-block align-baseline mx-0.5 font-normal text-slate-900"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        const fallback = rawFormula
          .replace(/\\cdot/g, "·")
          .replace(/\\times/g, "×")
          .replace(/\\div/g, "÷")
          .replace(/\{([^}]+)\}/g, "$1");
        return (
          <code key={index} className="font-mono text-[0.92em] px-1 py-0.5 rounded bg-slate-100 text-slate-800">
            {fallback}
          </code>
        );
      }
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}
