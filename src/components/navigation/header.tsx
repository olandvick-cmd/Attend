"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface HeaderProps {
  user?: {
    id?: string;
    name?: string;
    full_name?: string;
    avatarUrl?: string;
    avatar_url?: string;
    avatar?: string;
  } | null;
}

export function Header({ user }: HeaderProps) {
  const supabase = createClient();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Fetch actual notifications and subscribe to real-time updates
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, created_at, read")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setNotifications(data);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    fetchNotifications();

    if (!user?.id) return;

    // Set up Realtime listener for incoming notifications
    const channel = supabase
      .channel(`header-realtime-notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationItem;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user?.id, fetchNotifications]);

  // Determine avatar URL with fallbacks
  const avatarSrc = user?.avatarUrl || user?.avatar_url || user?.avatar;
  
  // Determine user name with fallbacks
  const displayName = user?.full_name || user?.name || "";
  
  // Extract initials if no avatar URL exists
  const initial = displayName ? displayName[0].toUpperCase() : "P";

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle click outside popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    if (!user?.id) return;

    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          Attend<span className="text-violet-600">.</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Home
          </Link>

          <Link
            href="/discover"
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
          >
            Discover
          </Link>

          <Link
            href="/create"
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
          >
            Create
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Notification Menu Wrapper */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-600 ring-2 ring-white" />
              )}
            </button>

            {/* Notification Popover */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-neutral-100 bg-white p-4 shadow-xl ring-1 ring-black/5 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-violet-600 hover:text-violet-700"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-neutral-50">
                  {notifications.length > 0 ? (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => markAsRead(item.id)}
                        className={`cursor-pointer py-3 transition hover:bg-neutral-50/50 px-2 rounded-lg ${
                          !item.read ? "bg-violet-50/30" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-neutral-900">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-neutral-400 shrink-0">
                            {new Date(item.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500 leading-snug">
                          {item.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      No notifications right now.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/saved"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 sm:block"
          >
            Saved
          </Link>

          <Link
            href="/profile"
            className="group flex items-center gap-2 rounded-full p-1 transition hover:bg-neutral-50 sm:px-3 sm:py-1.5"
          >
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={displayName || "User profile"}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-violet-600/10"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                {initial}
              </div>
            )}
            <span className="hidden text-sm font-medium text-neutral-700 group-hover:text-neutral-900 md:inline">
              Profile
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}