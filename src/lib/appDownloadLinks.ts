// Where the "Tải app về máy" page downloads the installers from when this server does not
// carry them (for example the AI Studio site, which cannot hold the 96 MB of installers).
//
// Put the GitHub repository that holds the Release with SmartStudy.apk and
// SmartStudy-Windows.exe, written as "tên-tài-khoản/tên-kho", e.g. "pn9055162/smartstudy".
// Leave it empty to use only files served by this server (/downloads/...).
export const GITHUB_RELEASES_REPO = "";

export function externalDownloadUrl(fileName: string): string | null {
  const repo = GITHUB_RELEASES_REPO.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\/+$/, "");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;
  return `https://github.com/${repo}/releases/latest/download/${fileName}`;
}
