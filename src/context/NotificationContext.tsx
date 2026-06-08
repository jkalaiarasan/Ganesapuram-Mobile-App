import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const STORAGE_KEY = '@ganesapuram_notifications';
const MAX_STORED   = 50;

export interface StoredNotification {
  id: string;
  title: string;
  body: string;
  receivedAt: string;  // ISO-8601
  viewed: boolean;
  data?: Record<string, any>;
}

interface NotificationContextType {
  notifications: StoredNotification[];
  unreadCount: number;
  markViewed: (id: string) => void;
  markAllViewed: () => void;
  clearAll: () => void;
  // Set to true when user taps a notification from the OS tray → opens panel
  pendingOpenPanel: boolean;
  clearPendingOpen: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markViewed: () => {},
  markAllViewed: () => {},
  clearAll: () => {},
  pendingOpenPanel: false,
  clearPendingOpen: () => {},
});

function persist(notifs: StoredNotification[]) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
}

function buildFromExpo(
  notification: Notifications.Notification,
  viewed = false,
): StoredNotification {
  return {
    id: notification.request.identifier,
    title: notification.request.content.title ?? '',
    body:  notification.request.content.body  ?? '',
    receivedAt: new Date().toISOString(),
    viewed,
    data: (notification.request.content.data as Record<string, any>) ?? {},
  };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [pendingOpenPanel, setPendingOpenPanel] = useState(false);

  // ── Upsert helper (functional setState — no stale closures) ──────────────────
  const upsert = (n: StoredNotification) => {
    setNotifications(prev => {
      const exists = prev.some(p => p.id === n.id);
      const updated = exists
        ? prev.map(p => p.id === n.id ? { ...p, viewed: p.viewed || n.viewed } : p)
        : [n, ...prev].slice(0, MAX_STORED);
      persist(updated);
      return updated;
    });
  };

  useEffect(() => {
    // Restore persisted notifications
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try { setNotifications(JSON.parse(raw)); } catch {}
      }
    });

    // ── Foreground notification received ─────────────────────────────────────
    const receivedSub = Notifications.addNotificationReceivedListener(notification => {
      upsert(buildFromExpo(notification, false));
    });

    // ── User tapped a notification (background / killed state) ───────────────
    const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
      upsert(buildFromExpo(response.notification, true));
      setPendingOpenPanel(true);  // auto-open panel when tapped from OS tray
    });

    // ── Killed-state: app opened by tapping a notification ───────────────────
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        upsert(buildFromExpo(response.notification, true));
        setPendingOpenPanel(true);
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  const markViewed = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, viewed: true } : n);
      persist(updated);
      return updated;
    });
  };

  const markAllViewed = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, viewed: true }));
      persist(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  };

  const clearPendingOpen = () => setPendingOpenPanel(false);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount: notifications.filter(n => !n.viewed).length,
      markViewed,
      markAllViewed,
      clearAll,
      pendingOpenPanel,
      clearPendingOpen,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

// ── Utility: relative time in Tamil ──────────────────────────────────────────
export function formatRelativeTime(isoString: string): string {
  const diff  = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  <  1) return 'இப்போது';
  if (mins  < 60) return `${mins} நிமிடம் முன்பு`;
  if (hours < 24) return `${hours} மணி முன்பு`;
  if (days  ===1) return 'நேற்று';
  if (days  <  7) return `${days} நாள் முன்பு`;

  const d = new Date(isoString);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

// ── Utility: extract leading emoji from notification title ─────────────────
export function extractIcon(title: string): { icon: string; cleanTitle: string } {
  // Match one emoji cluster at the very start (covers most Unicode emoji)
  const m = title.match(/^(\p{Emoji_Presentation}|\p{Emoji}️[\u{20E3}\u{FE0F}\u{1F3FB}-\u{1F3FF}]?)\s*/u);
  if (m) return { icon: m[1], cleanTitle: title.slice(m[0].length) };
  return { icon: '🔔', cleanTitle: title };
}
