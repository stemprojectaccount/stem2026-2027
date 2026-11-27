import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export const mathRemarkPlugins = [remarkMath];
export const mathRehypePlugins = [rehypeKatex];

/**
 * Normalizes mathematical formulas in Markdown text:
 * - Converts LaTeX brackets \[ ... \] to $$ ... $$ (display math)
 * - Converts LaTeX parentheses \( ... \) to $ ... $ (inline math)
 * - Ensures raw exponents like x^2, a^2 + b^2 = c^2, (a+b)^2, 10^3 outside of $...$ are wrapped in $...$
 * - Preserves code blocks and inline code.
 */
export function normalizeMathInText(content: string): string {
  if (!content) return "";

  let text = content;

  // 1. Convert \[ ... \] to $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);

  // 2. Convert \( ... \) to $ ... $
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 3. Temporarily protect code blocks and inline code
  const preservedBlocks: string[] = [];
  text = text.replace(/(```[\s\S]*?```|`[^`]+`)/g, (match) => {
    preservedBlocks.push(match);
    return `___PRESERVED_BLOCK_${preservedBlocks.length - 1}___`;
  });

  // 4. Temporarily protect existing $...$ and $$...$$ blocks
  text = text.replace(/(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$)/g, (match) => {
    preservedBlocks.push(match);
    return `___PRESERVED_BLOCK_${preservedBlocks.length - 1}___`;
  });

  // 5. In the remaining plain text, convert raw expressions with powers (e.g., x^2, a^2 + b^2 = c^2, 10^5, cm^2) to $...$
  // Match formulas with ^ that are standard mathematical expressions
  text = text.replace(/(?<![\w$])((?:[a-zA-Z0-9\(\)]+\^[0-9a-zA-Z\+\-\{\}]+)(?:[\s\+\-\*\/=]+[a-zA-Z0-9\(\)\^\+\-\{\}]+)*)(?![\w$])/g, (match) => {
    // Only wrap if it looks like a math formula and doesn't contain url characters
    if (match.includes("://") || match.startsWith("#")) return match;
    return `$${match.trim()}$`;
  });

  // 6. Restore all protected blocks
  text = text.replace(/___PRESERVED_BLOCK_(\d+)___/g, (_, idx) => {
    return preservedBlocks[parseInt(idx, 10)] ?? "";
  });

  return text;
}
