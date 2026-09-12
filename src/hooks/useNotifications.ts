"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/client";

import type {
  Notification,
  NotificationFilter,
} from "@/lib/notifications/types";

export function useNotifications(
  filter: NotificationFilter = "all"
) {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [items, count] = await Promise.all([
        getNotifications(filter),
        getUnreadNotificationCount(),
      ]);

      setNotifications(items);
      setUnreadCount(count);
    } catch (err) {
      console.error(err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = useCallback(
    async (id: string) => {
      const notification = notifications.find(
        (item) => item.id === id
      );

      if (!notification || notification.status === "read") {
        return;
      }

      const success = await markNotificationRead(id);

      if (!success) return;

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

      setUnreadCount((count) =>
        Math.max(0, count - 1)
      );
    },
    [notifications]
  );

  const markAllRead = useCallback(async () => {
    const count =
      await markAllNotificationsRead();

    if (count <= 0) return;

    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        status: "read",
        read_at:
          item.read_at ??
          new Date().toISOString(),
      }))
    );

    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: loadNotifications,
    markRead,
    markAllRead,
  };
}