"use client";

import Link from "next/link";
import { Bell, X } from "lucide-react";

import type { Notification } from "@/lib/notifications/types";

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

export function NotificationToast({
  notification,
  onClose,
}: NotificationToastProps) {
  return (
    <div className="fixed right-4 top-20 z-[100] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Bell className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900">
              {notification.title}
            </p>

            {notification.message && (
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                {notification.message}
              </p>
            )}

            {notification.action_url && (
              <Link
                href={notification.action_url}
                onClick={onClose}
                className="mt-2 inline-block text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                {notification.action_label || "View"}
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="shrink-0 rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}