import { auth } from '../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function isFirestoreQuotaError(error: unknown): boolean {
  if (!error) return false;
  const str = typeof error === 'object' && error !== null 
    ? ((error as any).code || '') + ' ' + ((error as any).message || '')
    : String(error);
  return str.toLowerCase().includes('resource-exhausted') || 
         str.toLowerCase().includes('quota limit exceeded') ||
         str.toLowerCase().includes('quota exceeded') ||
         str.toLowerCase().includes('free daily write units');
}

export function checkIsQuotaExhausted(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const item = localStorage.getItem('smartstudy_firestore_quota_exhausted_until');
    if (item) {
      const until = parseInt(item, 10);
      if (!isNaN(until) && Date.now() < until) {
        return true;
      } else {
        localStorage.removeItem('smartstudy_firestore_quota_exhausted_until');
      }
    }
    return sessionStorage.getItem('smartstudy_firestore_quota_exhausted') === 'true';
  } catch {
    return false;
  }
}

export function markQuotaExhausted(): void {
  try {
    if (typeof window === 'undefined') return;
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    localStorage.setItem('smartstudy_firestore_quota_exhausted_until', expiry.toString());
    sessionStorage.setItem('smartstudy_firestore_quota_exhausted', 'true');
    window.dispatchEvent(new CustomEvent('smartstudy_quota_exhausted'));
  } catch {
    // Ignore storage errors
  }
}

export function clearQuotaExhausted(): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('smartstudy_firestore_quota_exhausted_until');
    sessionStorage.removeItem('smartstudy_firestore_quota_exhausted');
  } catch {}
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  // If Firestore quota limit exceeded, degrade gracefully to offline local mode
  if (isFirestoreQuotaError(error)) {
    markQuotaExhausted();
    console.warn(`[Firestore Quota Exceeded] ${operationType} on ${path}. Operating safely in offline local-storage mode.`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Non-Fatal Notice: ', JSON.stringify(errInfo));
}
