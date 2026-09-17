"use client";

import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

function formatNotificationDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
  } = useNotifications("all");

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Notifications
                </h1>

                <p className="text-sm text-gray-500">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${
                        unreadCount === 1 ? "" : "s"
                      }`
                    : "You're all caught up"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/settings/notifications"
              className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Notification settings
            </Link>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <Bell className="mx-auto mb-4 h-8 w-8 text-gray-300" />

            <h2 className="font-medium text-gray-900">
              No notifications yet
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Activity from your events and campaigns will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            {notifications.map((notification) => {
              const unread = notification.status === "unread";

              return (
                <div
                  key={notification.id}
                  className={`border-b border-gray-100 last:border-b-0 ${
                    unread ? "bg-purple-50/40" : "bg-white"
                  }`}
                >
                  <Link
                    href={notification.action_url || "#"}
                    onClick={() => {
                      if (unread) {
                        markRead(notification.id);
                      }
                    }}
                    className="block px-5 py-5 transition hover:bg-gray-50"
                  >
                    <div className="flex gap-4">
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100">
                        <Bell className="h-4 w-4 text-purple-600" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2
                              className={`text-sm ${
                                unread
                                  ? "font-semibold text-gray-900"
                                  : "font-medium text-gray-800"
                              }`}
                            >
                              {notification.title}
                            </h2>

                            {notification.message && (
                              <p className="mt-1 text-sm leading-6 text-gray-600">
                                {notification.message}
                              </p>
                            )}
                          </div>

                          {unread && (
                            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-purple-600" />
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-4">
                          <span className="text-xs text-gray-400">
                            {formatNotificationDate(
                              notification.created_at
                            )}
                          </span>

                          {notification.action_label && (
                            <span className="text-xs font-medium text-purple-600">
                              {notification.action_label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}