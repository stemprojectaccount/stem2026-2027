// Every shared lesson link and QR code points at the public SmartStudy site, so links made
// in the desktop app, the Android app or on localhost still open for the person receiving them.
export const PUBLIC_SHARE_BASE_URL = "https://smartstudyquest.ai.studio/";

export function buildPublicLessonUrl(cleanLessonId: string, markerTag: string): string {
  return `${PUBLIC_SHARE_BASE_URL}?lessonId=${encodeURIComponent(cleanLessonId)}#${markerTag}`;
}
