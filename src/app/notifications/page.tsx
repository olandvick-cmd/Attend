"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Loader2,
} from "lucide-react";

import { useNotifications } from "@/hooks/useNotifications";
import type {
  NotificationFilter,
} from "@/lib/notifications/types";

const filters: {
  label: string;
  value: NotificationFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Events", value: "events" },
  { label: "Campaigns", value: "campaigns" },
  { label: "Activity", value: "activity" },
  { label: "Recommendations", value: "recommendations" },
];

export default function NotificationsPage() {
  const [filter, setFilter] =
    useState<NotificationFilter>("all");

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markRead,
    markAllRead,
  } = useNotifications(filter);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Notifications
              </h1>

              <p className="text-sm text-gray-500">
                Stay updated with what matters on Attend.
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item.value}
              onClick={() =>
                setFilter(item.value)
              }
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === item.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-600">
              {error}
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              You're all caught up
            </h2>

            <p className="mt-1 max-w-sm text-sm text-gray-500">
              New event updates, campaign activity and
              recommendations will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (
                    notification.status !== "read"
                  ) {
                    markRead(notification.id);
                  }
                }}
                className={`relative flex gap-4 p-4 transition hover:bg-gray-50 ${
                  notification.status !== "read"
                    ? "bg-purple-50/40"
                    : "bg-white"
                }`}
              >
                {notification.status !== "read" && (
                  <span className="absolute left-1 top-5 h-2 w-2 rounded-full bg-purple-600" />
                )}

                <div className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                  <Bell className="h-5 w-5 text-purple-600" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-gray-900">
                      {notification.title}
                    </h3>

                    <span className="shrink-0 text-xs text-gray-400">
                      {formatNotificationDate(
                        notification.created_at
                      )}
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {notification.message}
                  </p>

                  {notification.action_url && (
                    <Link
                      href={notification.action_url}
                      onClick={(event) => {
                        event.stopPropagation();
                        markRead(notification.id);
                      }}
                      className="mt-3 inline-flex text-sm font-semibold text-purple-600 hover:text-purple-700"
                    >
                      {notification.action_label ||
                        "View"}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function formatNotificationDate(
  date: string
) {
  const created = new Date(date);
  const now = new Date();

  const diff =
    now.getTime() - created.getTime();

  const minutes = Math.floor(
    diff / 60000
  );

  if (minutes < 1) return "now";

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(
    minutes / 60
  );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(
    hours / 24
  );

  if (days < 7) {
    return `${days}d`;
  }

  return created.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
    }
  );
}