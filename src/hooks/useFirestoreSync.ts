import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { 
  auth, 
  db, 
  signInWithGoogleSmart, 
  signInWithGoogleRedirect, 
  signInWithGooglePopup, 
  handleRedirectResult, 
  logOutUser,
  safelyDisableFirestoreNetwork
} from '../firebase';
import { Lesson, UserProgress } from '../types';
import { 
  handleFirestoreError, 
  isFirestoreQuotaError, 
  checkIsQuotaExhausted, 
  markQuotaExhausted, 
  OperationType 
} from '../lib/firestoreError';
import { getSupportProfile, setSupportProfile, useSupportProfile } from '../lib/support/profile';

// "Hỗ trợ học tập" travels with the account; only sent once the student has changed it
const supportField = () => {
  const s = getSupportProfile();
  return s.updatedAt ? { support: s } : {};
};

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'quota-exhausted';

export function useFirestoreSync(
  localLessons: Lesson[],
  setLocalLessons: (lessons: Lesson[]) => void,
  localProgress: UserProgress,
  setLocalProgress: (progress: UserProgress) => void
) {
  const [user, loading, authError] = useAuthState(auth);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    return checkIsQuotaExhausted() ? 'quota-exhausted' : 'idle';
  });
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  // Circuit breaker: When Firestore quota limit is exceeded, switch to local storage mode
  const [isQuotaExhausted, setIsQuotaExhausted] = useState<boolean>(() => {
    return checkIsQuotaExhausted();
  });

  const isInitialLoad = useRef(true);
  const skipNextLocalSync = useRef(false);
  const lastSavedPayloadRef = useRef<string>('');
  const latestLessonsRef = useRef<Lesson[]>(localLessons);
  const latestProgressRef = useRef<UserProgress>(localProgress);
  const lastLocalAvatarUpdateAtRef = useRef<number>(0);
  const supportStamp = useSupportProfile().updatedAt || 0;
  const supportSavedRef = useRef<number>(0);

  // Keep refs synchronized with the latest React state on every render
  useEffect(() => {
    latestLessonsRef.current = localLessons;
  }, [localLessons]);

  useEffect(() => {
    if (latestProgressRef.current.avatarUrl !== localProgress.avatarUrl) {
      lastLocalAvatarUpdateAtRef.current = Date.now();
    }
    latestProgressRef.current = localProgress;
  }, [localProgress]);

  // Listen for quota exhaustion events triggered globally
  useEffect(() => {
    const handleExhausted = () => {
      setIsQuotaExhausted(true);
      setSyncStatus('quota-exhausted');
      setSyncErrorMessage('Đám mây đạt hạn mức miễn phí hôm nay. Dữ liệu đang được lưu trữ an toàn trên máy!');
      safelyDisableFirestoreNetwork();
    };

    window.addEventListener('smartstudy_quota_exhausted', handleExhausted);
    return () => {
      window.removeEventListener('smartstudy_quota_exhausted', handleExhausted);
    };
  }, []);

  // Check for Google redirect sign-in result on mount (essential for mobile browsers)
  useEffect(() => {
    handleRedirectResult()
      .then((redirectUser) => {
        if (redirectUser) {
          console.info("Đã khôi phục phiên đăng nhập từ Redirect:", redirectUser.email);
        }
      })
      .catch((err) => {
        console.error("Lỗi khi kiểm tra Redirect Result:", err);
      });
  }, []);

  // Compute canonical JSON string for payload comparison
  const getPayloadFingerprint = (lessons: Lesson[], prog: UserProgress) => {
    return JSON.stringify({
      lessonIds: lessons.map(l => `${l.id}:${l.completed ? 1 : 0}:${l.notes?.length || 0}`).sort(),
      lessonCount: lessons.length,
      points: prog.points,
      level: prog.level,
      streak: prog.streak,
      coins: prog.coins,
      lessonsCompletedCount: prog.lessonsCompletedCount,
      testsTakenCount: prog.testsTakenCount,
      displayName: prog.displayName || '',
      avatarUrl: prog.avatarUrl || '',
      nickname: prog.nickname || '',
      titleBadge: prog.titleBadge || '',
      grade: prog.grade || '',
      school: prog.school || '',
      equippedOutfit: prog.equippedOutfit || ''
    });
  };

  // Helper to get a Firestore-rule-safe top-level photoURL (firestore.rules limits top-level photoURL to <= 1000 chars)
  const getSafeTopLevelPhotoURL = (avatarUrl?: string, fallbackPhotoURL?: string | null) => {
    const candidate = avatarUrl || fallbackPhotoURL || '';
    return candidate.length <= 950 ? candidate : (fallbackPhotoURL && fallbackPhotoURL.length <= 950 ? fallbackPhotoURL : '');
  };

  // 1. Load data when user logs in or auth state changes
  useEffect(() => {
    if (!user) {
      setSyncStatus('idle');
      isInitialLoad.current = true;
      return;
    }

    if (isQuotaExhausted || checkIsQuotaExhausted()) {
      safelyDisableFirestoreNetwork();
      setSyncStatus('quota-exhausted');
      setSyncErrorMessage('Đám mây đạt hạn mức miễn phí hôm nay. Dữ liệu đang được lưu trữ an toàn trên máy!');
      isInitialLoad.current = false;
      return;
    }

    const userDocPath = `users/${user.uid}`;
    const userDocRef = doc(db, 'users', user.uid);
    setSyncStatus('syncing');

    // Subscribe to real-time changes
    const unsubscribe = onSnapshot(
      userDocRef,
      async (docSnap) => {
        if (skipNextLocalSync.current) {
          skipNextLocalSync.current = false;
          setSyncStatus('synced');
          setLastSyncedTime(new Date());
          return;
        }

        const currentLocalLessons = latestLessonsRef.current;
        const currentLocalProgress = latestProgressRef.current;

        if (docSnap.exists()) {
          const data = docSnap.data();
          // newest support settings win (changed on another device → apply here)
          const remoteSupport = data.support;
          if (remoteSupport && (remoteSupport.updatedAt || 0) > (getSupportProfile().updatedAt || 0)) setSupportProfile(remoteSupport);
          supportSavedRef.current = remoteSupport?.updatedAt || 0;
          if (data.lessons && Array.isArray(data.lessons)) {
            setLocalLessons(data.lessons);
            latestLessonsRef.current = data.lessons;
            try {
              localStorage.setItem('smart_study_lessons_v2', JSON.stringify(data.lessons));
            } catch {}
          }
          if (data.progress) {
            // Preserve custom uploaded avatar or recently updated local avatar so a delayed snapshot cannot revert it
            const recentlyUpdatedAvatarLocally = Date.now() - lastLocalAvatarUpdateAtRef.current < 15000;
            let cachedCustomAvatar: string | null = null;
            try {
              cachedCustomAvatar = localStorage.getItem('smart_study_custom_avatar_data_v1');
            } catch {}

            const serverAvatarUrl = data.progress?.avatarUrl || '';
            const resolvedAvatarUrl =
              (recentlyUpdatedAvatarLocally && currentLocalProgress.avatarUrl)
                ? currentLocalProgress.avatarUrl
                : (cachedCustomAvatar && cachedCustomAvatar.startsWith('data:image/') && (!serverAvatarUrl || !serverAvatarUrl.startsWith('data:image/')))
                ? cachedCustomAvatar
                : (serverAvatarUrl || currentLocalProgress.avatarUrl || data.photoURL || (user.photoURL || ''));

            const mergedProgress: UserProgress = {
              ...currentLocalProgress,
              ...data.progress,
              displayName: data.displayName || data.progress.displayName || currentLocalProgress.displayName || (user.displayName || 'Học sinh SmartStudy'),
              avatarUrl: resolvedAvatarUrl,
              grade: data.grade || data.progress.grade || currentLocalProgress.grade || 'Lớp 6',
              school: data.school || data.progress.school || currentLocalProgress.school || 'THCS SmartStudy'
            };
            latestProgressRef.current = mergedProgress;
            setLocalProgress(mergedProgress);
            try {
              localStorage.setItem('smart_study_progress_v2', JSON.stringify(mergedProgress));
            } catch {}
            if (mergedProgress.avatarUrl && mergedProgress.avatarUrl.startsWith('mascot:')) {
              const parsedIdx = parseInt(mergedProgress.avatarUrl.replace('mascot:', ''), 10);
              if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < 6) {
                try {
                  localStorage.setItem('smart_study_avatar_idx_v2', parsedIdx.toString());
                } catch {}
              }
            }
            // Mark the server payload as current so the auto-sync effect doesn't bounce it back!
            lastSavedPayloadRef.current = getPayloadFingerprint(data.lessons || currentLocalLessons, mergedProgress);
          }
          setSyncStatus('synced');
          setLastSyncedTime(new Date());
        } else {
          // New user document on Firestore: initialize with current progress & profile
          try {
            const initialFingerprint = getPayloadFingerprint(currentLocalLessons, currentLocalProgress);
            lastSavedPayloadRef.current = initialFingerprint;
            skipNextLocalSync.current = true;
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email || '',
              displayName: currentLocalProgress.displayName || user.displayName || 'Học sinh SmartStudy',
              photoURL: getSafeTopLevelPhotoURL(currentLocalProgress.avatarUrl, user.photoURL),
              grade: currentLocalProgress.grade || 'Lớp 6',
              school: currentLocalProgress.school || 'THCS SmartStudy',
              lessons: currentLocalLessons,
              progress: currentLocalProgress,
              ...supportField(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            setSyncStatus('synced');
            setLastSyncedTime(new Date());
          } catch (initErr) {
            if (isFirestoreQuotaError(initErr)) {
              markQuotaExhausted();
              safelyDisableFirestoreNetwork();
              setIsQuotaExhausted(true);
              setSyncStatus('quota-exhausted');
              setSyncErrorMessage('Hạn ngạch Cloud miễn phí đạt giới hạn hôm nay. Đã lưu trữ cục bộ an toàn!');
            } else {
              setSyncStatus('error');
              setSyncErrorMessage('Không thể khởi tạo dữ liệu đám mây');
            }
            handleFirestoreError(initErr, OperationType.CREATE, userDocPath);
          }
        }
        isInitialLoad.current = false;
      },
      (error) => {
        if (isFirestoreQuotaError(error)) {
          markQuotaExhausted();
          safelyDisableFirestoreNetwork();
          setIsQuotaExhausted(true);
          setSyncStatus('quota-exhausted');
          setSyncErrorMessage('Hạn ngạch Cloud miễn phí đạt giới hạn hôm nay. Đã lưu trữ cục bộ an toàn!');
        } else {
          setSyncStatus('error');
          setSyncErrorMessage('Lỗi đọc dữ liệu đám mây');
        }
        handleFirestoreError(error, OperationType.GET, userDocPath);
      }
    );

    return () => unsubscribe();
  }, [user, isQuotaExhausted]);

  // 2. Debounced auto-sync local changes to cloud (with loop prevention & circuit breaker)
  useEffect(() => {
    // If not logged in, during initial load, or if quota is exhausted: DO NOT WRITE TO FIRESTORE
    if (!user || isInitialLoad.current || loading || isQuotaExhausted) return;

    // Check if the data has actually changed compared to the last saved payload
    const currentFingerprint = getPayloadFingerprint(localLessons, localProgress);
    if (currentFingerprint === lastSavedPayloadRef.current && supportStamp === supportSavedRef.current) {
      // Data is identical! Do not waste quota!
      return;
    }

    const userDocPath = `users/${user.uid}`;
    const saveToFirestore = async () => {
      // Re-check before executing async
      if (isQuotaExhausted) return;

      const progToSave = latestProgressRef.current;
      const lessonsToSave = latestLessonsRef.current;
      const latestFingerprint = getPayloadFingerprint(lessonsToSave, progToSave);

      skipNextLocalSync.current = true;
      setSyncStatus('syncing');
      try {
        lastSavedPayloadRef.current = latestFingerprint;
        supportSavedRef.current = getSupportProfile().updatedAt || 0;
        await setDoc(
          doc(db, 'users', user.uid),
          {
            uid: user.uid,
            displayName: progToSave.displayName || user.displayName || 'Học sinh SmartStudy',
            email: user.email || '',
            photoURL: getSafeTopLevelPhotoURL(progToSave.avatarUrl, user.photoURL),
            grade: progToSave.grade || 'Lớp 6',
            school: progToSave.school || 'THCS SmartStudy',
            lessons: lessonsToSave,
            progress: progToSave,
            ...supportField(),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
        setSyncStatus('synced');
        setLastSyncedTime(new Date());
      } catch (err) {
        if (isFirestoreQuotaError(err)) {
          markQuotaExhausted();
          safelyDisableFirestoreNetwork();
          setIsQuotaExhausted(true);
          setSyncStatus('quota-exhausted');
          setSyncErrorMessage('Hạn ngạch Cloud miễn phí đạt giới hạn hôm nay. Đã chuyển sang lưu trữ cục bộ an toàn!');
        } else {
          setSyncStatus('error');
          setSyncErrorMessage('Lỗi đồng bộ dữ liệu');
        }
        handleFirestoreError(err, OperationType.UPDATE, userDocPath);
      }
    };

    // 5-second debounce ensures rapid updates don't spam Firestore writes
    const timeout = setTimeout(saveToFirestore, 5000);
    return () => clearTimeout(timeout);
  }, [localLessons, localProgress, supportStamp, user, loading, isQuotaExhausted]);

  // 3. Force manual sync on demand (accepts optional fresh progress/lessons to avoid stale React state closures)
  const forceSync = useCallback(async (overrideProgress?: UserProgress, overrideLessons?: Lesson[]) => {
    if (!user) return;

    if (isQuotaExhausted || checkIsQuotaExhausted()) {
      safelyDisableFirestoreNetwork();
      setSyncStatus('quota-exhausted');
      return;
    }

    const progToSave = overrideProgress || latestProgressRef.current;
    const lessonsToSave = overrideLessons || latestLessonsRef.current;
    if (overrideProgress) {
      if (latestProgressRef.current.avatarUrl !== overrideProgress.avatarUrl) {
        lastLocalAvatarUpdateAtRef.current = Date.now();
      }
      latestProgressRef.current = overrideProgress;
    }
    if (overrideLessons) {
      latestLessonsRef.current = overrideLessons;
    }

    const userDocPath = `users/${user.uid}`;
    skipNextLocalSync.current = true;
    setSyncStatus('syncing');
    try {
      lastSavedPayloadRef.current = getPayloadFingerprint(lessonsToSave, progToSave);
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          displayName: progToSave.displayName || user.displayName || 'Học sinh SmartStudy',
          email: user.email || '',
          photoURL: getSafeTopLevelPhotoURL(progToSave.avatarUrl, user.photoURL),
          grade: progToSave.grade || 'Lớp 6',
          school: progToSave.school || 'THCS SmartStudy',
          lessons: lessonsToSave,
          progress: progToSave,
          ...supportField(),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      setSyncStatus('synced');
      setLastSyncedTime(new Date());
    } catch (err) {
      if (isFirestoreQuotaError(err)) {
        markQuotaExhausted();
        safelyDisableFirestoreNetwork();
        setIsQuotaExhausted(true);
        setSyncStatus('quota-exhausted');
        setSyncErrorMessage('Hạn ngạch Cloud miễn phí đạt giới hạn hôm nay. Đã lưu trữ cục bộ an toàn!');
      } else {
        setSyncStatus('error');
        setSyncErrorMessage('Không thể lưu tức thì');
      }
      handleFirestoreError(err, OperationType.WRITE, userDocPath);
    }
  }, [user, isQuotaExhausted]);

  return {
    user,
    loading,
    authError,
    syncStatus,
    lastSyncedTime,
    syncErrorMessage,
    isQuotaExhausted,
    forceSync,
    logInWithGoogle: signInWithGoogleSmart,
    logInWithGoogleRedirect: signInWithGoogleRedirect,
    logInWithGooglePopup: signInWithGooglePopup,
    logOut: logOutUser
  };
}
