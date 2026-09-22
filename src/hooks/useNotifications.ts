"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/client";

import type { Notification } from "@/lib/notifications/types";

export function useNotifications(category = "all") {
  const supabase = useMemo(() => createClient(), []);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [latestNotification, setLatestNotification] =
    useState<Notification | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [items, count] = await Promise.all([
        getNotifications(category),
        getUnreadNotificationCount(),
      ]);

      setNotifications(items);
      setUnreadCount(count);
    } catch (error) {
      console.error(
        "[Attend Notifications] Refresh failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    let channel:
      | ReturnType<typeof supabase.channel>
      | null = null;

    async function setupRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled || !user) {
        return;
      }

      /*
       * IMPORTANT:
       * Register the postgres_changes listener BEFORE calling subscribe().
       */
      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log(
              "[Attend Notifications] New notification:",
              payload.new
            );

            const notification =
              payload.new as Notification;

            setLatestNotification(notification);

            /*
             * Refresh the normal notification list and
             * unread count after receiving the realtime event.
             */
            refresh();
          }
        );

      if (cancelled) {
        await supabase.removeChannel(channel);
        channel = null;
        return;
      }

      await channel.subscribe((status) => {
        console.log(
          "[Attend Notifications] Realtime status:",
          status
        );
      });
    }

    setupRealtime();

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [supabase, refresh]);

  const dismissLatestNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  const markRead = useCallback(
    async (id: string) => {
      try {
        const notification = notifications.find(
          (item) => item.id === id
        );

        if (!notification) {
          return;
        }

        if (notification.status === "read") {
          return;
        }

        const success = await markNotificationRead(id);

        if (!success) {
          return;
        }

        setNotifications((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "read",
                  read_at:
                    item.read_at ??
                    new Date().toISOString(),
                }
              : item
          )
        );

        setUnreadCount((current) =>
          Math.max(0, current - 1)
        );
      } catch (error) {
        console.error(
          "[Attend Notifications] Mark read failed:",
          error
        );
      }
    },
    [notifications]
  );

  const markAllRead = useCallback(async () => {
    try {
      if (unreadCount === 0) {
        return;
      }

      await markAllNotificationsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          status: "read",
          read_at:
            notification.read_at ??
            new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "[Attend Notifications] Mark all read failed:",
        error
      );
    }
  }, [unreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    latestNotification,
    dismissLatestNotification,
    refresh,
    markRead,
    markAllRead,
  };
}