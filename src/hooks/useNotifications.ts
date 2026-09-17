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

  /*
   * =========================================================
   * REFRESH NOTIFICATIONS
   * =========================================================
   */
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

  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */
  useEffect(() => {
    refresh();
  }, [refresh]);

  /*
   * =========================================================
   * REALTIME NOTIFICATIONS
   * =========================================================
   */
  useEffect(() => {
    let activeChannel: ReturnType<typeof supabase.channel> | null = null;

    async function setupRealtime() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            refresh();
          }
        )
        .subscribe((status) => {
          console.log(
            "[Attend Notifications] Realtime status:",
            status
          );
        });

      activeChannel = channel;
    }

    setupRealtime();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [supabase, refresh]);

  /*
   * =========================================================
   * MARK ONE AS READ
   * =========================================================
   */
  const markRead = useCallback(
    async (id: string) => {
      try {
        const notification = notifications.find(
          (item) => item.id === id
        );

        if (!notification || notification.status === "read") {
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

  /*
   * =========================================================
   * MARK ALL AS READ
   * =========================================================
   */
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
    refresh,
    markRead,
    markAllRead,
  };
}