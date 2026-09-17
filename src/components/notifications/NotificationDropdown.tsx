"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import type { Notification } from "@/lib/notifications/types";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  markRead,
  markAllRead,
  onClose,
}: NotificationDropdownProps) {
  const handleNotificationClick = async (
    notification: Notification
  ) => {
    if (notification.status !== "read") {
      await markRead(notification.id);
    }

    onClose();
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;

    await markAllRead();
  };

  return (
    <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-xl ring-1 ring-black/5 sm:w-96">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-4">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Notifications
            </h3>

            <p className="mt-0.5 text-[11px] text-neutral-400">
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "You're all caught up"}
            </p>
          </div>

          {unreadCount > 0 && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
              {unreadCount}
            </span>
          )}
        </div>

        {/* ===================================================
            MARK ALL AS READ
        =================================================== */}
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 transition hover:text-violet-700"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* =====================================================
          NOTIFICATION LIST
      ===================================================== */}
      <div className="max-h-80 overflow-y-auto divide-y divide-neutral-50">
        {loading ? (
          <div className="py-10 text-center text-xs text-neutral-400">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((item) => {
            const isUnread = item.status !== "read";

            return (
              <Link
                key={item.id}
                href={item.action_url || "/notifications"}
                onClick={() =>
                  handleNotificationClick(item)
                }
                className={`block px-4 py-3 transition hover:bg-neutral-50 ${
                  isUnread ? "bg-violet-50/40" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* STATUS DOT */}
                  <div className="pt-1.5">
                    {isUnread ? (
                      <span className="block h-2 w-2 rounded-full bg-violet-600" />
                    ) : (
                      <span className="block h-2 w-2 rounded-full bg-neutral-200" />
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={`text-xs text-neutral-900 ${
                          isUnread
                            ? "font-semibold"
                            : "font-medium"
                        }`}
                      >
                        {item.title}
                      </p>

                      <span className="shrink-0 text-[10px] text-neutral-400">
                        {new Date(
                          item.created_at
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {item.message && (
                      <p className="mt-1 text-xs leading-snug text-neutral-500">
                        {item.message}
                      </p>
                    )}

                    {item.action_label && (
                      <p className="mt-2 text-[11px] font-medium text-violet-600">
                        {item.action_label}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="py-10 text-center">
            <Bell className="mx-auto mb-3 h-6 w-6 text-neutral-300" />

            <p className="text-xs font-medium text-neutral-700">
              No notifications right now.
            </p>

            <p className="mt-1 text-[11px] text-neutral-400">
              Campaign activity will appear here.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          VIEW ALL
      ===================================================== */}
      <div className="border-t border-neutral-100 p-3">
        <Link
          href="/notifications"
          onClick={onClose}
          className="flex w-full items-center justify-center rounded-xl bg-neutral-50 px-3 py-2.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}