// Where the "Tải app về máy" page downloads the installers from when this server does not
// carry them (for example the AI Studio site, which cannot hold the 96 MB of installers).
//
// Put the GitHub repository that holds the Release with SmartStudy.apk and
// SmartStudy-Windows.exe, written as "tên-tài-khoản/tên-kho", e.g. "pn9055162/smartstudy".
// Leave it empty to use only files served by this server (/downloads/...).
export const GITHUB_RELEASES_REPO = "stemprojectaccount/stem2026-2027";

export function externalDownloadUrl(fileName: string): string | null {
  const repo = GITHUB_RELEASES_REPO.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\/+$/, "");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
  return `https://github.com/${repo}/releases/latest/download/${fileName}`;
}

/** Sizes (MB) of the files in the latest GitHub Release, by file name; empty when unreachable. */
export async function externalDownloadSizes(): Promise<Record<string, number>> {
  const repo = GITHUB_RELEASES_REPO.trim();
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return {};
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
    if (!r.ok) return {};
    const data: { assets?: { name: string; size: number }[] } = await r.json();
    return Object.fromEntries((data.assets || []).map((a) => [a.name, Math.round(a.size / 1048576)]));
  } catch {
    return {};
  }
}
