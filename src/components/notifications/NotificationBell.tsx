"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationBell() {
  const { unreadCount } = useNotifications("all");

  return (
    <Link
      href="/notifications"
      aria-label={
        unreadCount > 0
          ? `${unreadCount} unread notifications`
          : "Notifications"
      }
      className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
    >
      <Bell className="h-5 w-5" />

      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-semibold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}