import { useState, useCallback, useRef } from "react";

export type NotificationPermission = "default" | "granted" | "denied";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "danger" | "warning" | "info";
  timestamp: Date;
  read: boolean;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    () => (typeof Notification !== "undefined" ? Notification.permission : "default")
  );
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const cooldownRef = useRef<Record<string, number>>({});

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  const addNotification = useCallback(
    (title: string, message: string, type: AppNotification["type"] = "danger") => {
      const now = Date.now();
      const cooldownKey = title;
      if (cooldownRef.current[cooldownKey] && now - cooldownRef.current[cooldownKey] < 10000) {
        return;
      }
      cooldownRef.current[cooldownKey] = now;

      const notif: AppNotification = {
        id: `${now}-${Math.random()}`,
        title,
        message,
        type,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [notif, ...prev].slice(0, 20));

      if (permission === "granted") {
        try {
          const n = new Notification(title, {
            body: message,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: cooldownKey,
            requireInteraction: type === "danger",
          });
          setTimeout(() => n.close(), 8000);
        } catch {}
      }
    },
    [permission]
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { permission, requestPermission, notifications, addNotification, markAllRead, clearAll, unreadCount };
}
