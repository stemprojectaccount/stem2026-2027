import { useState, useEffect } from 'react';

const STORAGE_KEY_ENABLED = 'smart_study_reminder_enabled';
const STORAGE_KEY_TIME = 'smart_study_reminder_time';
const STORAGE_KEY_LAST_SENT = 'smart_study_reminder_last_sent';

const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined';
};

export function useStudyReminder() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
    } catch {
      return false;
    }
  });
  
  const [time, setTime] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_TIME) || '20:00';
    } catch {
      return '20:00';
    }
  });

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (isNotificationSupported()) {
      try {
        return Notification.permission;
      } catch {
        return 'default';
      }
    }
    return 'default';
  });

  const toggleReminder = async (newEnabled: boolean) => {
    if (newEnabled) {
      if (isNotificationSupported()) {
        try {
          if (Notification.permission !== 'granted') {
            const p = await Notification.requestPermission();
            setPermission(p);
            if (p !== 'granted') {
              // Permission not granted, but user can still enable in-app reminder
            }
          }
        } catch (e) {
          console.warn('Không thể yêu cầu quyền thông báo:', e);
        }
      }
    }
    
    setEnabled(newEnabled);
    try {
      localStorage.setItem(STORAGE_KEY_ENABLED, newEnabled.toString());
    } catch {}
    return true;
  };

  const updateTime = (newTime: string) => {
    setTime(newTime);
    try {
      localStorage.setItem(STORAGE_KEY_TIME, newTime);
    } catch {}
  };

  useEffect(() => {
    if (!enabled) return;

    const checkAndNotify = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const [targetHourStr, targetMinuteStr] = time.split(':');
      const targetHour = parseInt(targetHourStr, 10);
      const targetMinute = parseInt(targetMinuteStr, 10);

      if (currentHour === targetHour && currentMinute === targetMinute) {
        const todayStr = now.toDateString();
        let lastSent: string | null = null;
        try {
          lastSent = localStorage.getItem(STORAGE_KEY_LAST_SENT);
        } catch {}
        
        if (lastSent !== todayStr) {
          // Send notification if supported
          try {
            if (isNotificationSupported() && Notification.permission === 'granted') {
              new Notification('SmartStudy - Đến giờ học rồi!', {
                body: 'Hãy dành ra 15 phút ôn lại bài cũ và chinh phục kiến thức mới nhé!',
                icon: '/favicon.ico'
              });
            }
            localStorage.setItem(STORAGE_KEY_LAST_SENT, todayStr);
          } catch (e) {
            console.error('Lỗi khi gửi thông báo:', e);
          }
        }
      }
    };

    // Check immediately on mount/update
    checkAndNotify();

    // Check every minute (60000 ms)
    const intervalId = setInterval(checkAndNotify, 60000);

    return () => clearInterval(intervalId);
  }, [enabled, time, permission]);

  return {
    enabled,
    time,
    permission,
    isSupported: isNotificationSupported(),
    toggleReminder,
    updateTime
  };
}
