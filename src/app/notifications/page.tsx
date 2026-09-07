"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Calendar, CheckCheck, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "event" | "campaign" | "system";
  created_at: string;
  read: boolean;
}

export default function NotificationsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAndSubscribe() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // 1. Fetch initial notification list
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setNotifications(data);
      }

      setLoading(false);

      // 2. Set up Realtime listener for NEW notifications
      const channel = supabase
        .channel(`realtime:notifications:${user.id}`)
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
            // Prepend the new real-time notification to top of state list
            setNotifications((prev) => [newNotification, ...prev]);
          }
        )
        .subscribe();

      // Clean up subscription on unmount
      return () => {
        supabase.removeChannel(channel);
      };
    }

    loadAndSubscribe();
  }, [supabase]);

  const markAllAsRead = async () => {
    if (!userId) return;

    // Optimistically update local UI
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    // Update database records
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-12">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Profile
          </Link>
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-950">Notifications</h1>
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition ${
                  item.read
                    ? "border-neutral-200 bg-white"
                    : "border-violet-200 bg-violet-50/40 ring-1 ring-violet-500/10"
                }`}
              >
                <div className="mt-0.5 rounded-xl bg-violet-100 p-2.5 text-violet-700">
                  {item.type === "event" ? (
                    <Calendar className="h-4 w-4" />
                  ) : item.type === "campaign" ? (
                    <Sparkles className="h-4 w-4" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-neutral-900">{item.title}</h2>
                    <span className="text-[10px] font-medium text-neutral-400">
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">{item.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-3 text-sm font-semibold text-neutral-700">No notifications yet</p>
            <p className="mt-1 text-xs text-neutral-500">
              Activity regarding saved events and campaigns will show up here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}