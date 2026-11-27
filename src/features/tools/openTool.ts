// Open a tool of the Tools hub from anywhere (e.g. "Gõ thay nói" in Hỗ trợ học tập → conversation board).
// App switches to the tools tab; ToolsHub (mounted or not) opens the tool via the same session key it restores from.
export const OPEN_TOOL_EVENT = "smartstudy:open-tool";
export const TOOLS_LAST_KEY = "smartstudy_tools_last";

export function openTool(id: string) {
  try {
    sessionStorage.setItem(TOOLS_LAST_KEY, id);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(OPEN_TOOL_EVENT, { detail: { id } }));
}
