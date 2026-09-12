"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationPreferencesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    event_reminders: true,
    new_events: true,
    trending_events: false,
    campaign_activity: true,
    campaign_milestones: true,
    campaign_insights: true,
    recommendations: true,
    push_enabled: false,
    email_enabled: true,
    smart_notifications: true,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
  });

  useEffect(() => {
    async function loadPreferences() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data && !error) setPrefs(data);
      setLoading(false);
    }
    loadPreferences();
  }, [supabase]);

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savePreferences = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-xs text-neutral-400">Loading settings...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-bold text-neutral-900">Notification Preferences</h1>
      <p className="text-xs text-neutral-500 mt-1">Control how and when Attend sends notifications to you.</p>

      <div className="mt-6 space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-violet-600">Categories</h2>
        <div className="space-y-4">
          {[
            { id: "campaign_activity", title: "Campaign Activity", desc: "Notify when someone creates/downloads a DP from your campaign" },
            { id: "event_reminders", title: "Event Reminders", desc: "Get reminders for events you've registered for" },
            { id: "campaign_milestones", title: "Campaign Milestones", desc: "Alerts when campaigns hit download thresholds" },
            { id: "recommendations", title: "Recommendations", desc: "Tailored events based on your history" },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-800">{item.title}</p>
                <p className="text-xs text-neutral-400">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(prefs[item.id as keyof typeof prefs])}
                onChange={() => toggle(item.id as keyof typeof prefs)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
            </div>
          ))}
        </div>

        <hr className="border-neutral-100" />

        <h2 className="text-sm font-semibold text-violet-600">Delivery Channels</h2>
        <div className="space-y-4">
          {[
            { id: "email_enabled", title: "Email Notifications", desc: "Receive summary updates via email" },
            { id: "push_enabled", title: "Browser Push Alerts", desc: "Get real-time browser push popups" },
            { id: "smart_notifications", title: "Smart Batching", desc: "Combine multiple events to avoid notification fatigue" },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-800">{item.title}</p>
                <p className="text-xs text-neutral-400">{item.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(prefs[item.id as keyof typeof prefs])}
                onChange={() => toggle(item.id as keyof typeof prefs)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-neutral-100 flex justify-end">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="rounded-xl bg-violet-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}