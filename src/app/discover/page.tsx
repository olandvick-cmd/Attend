"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
ArrowRight,
CalendarDays,
Image as ImageIcon,
Loader2,
MapPin,
Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Category = {
id: string;
name: string;
slug: string;
icon?: string | null;
};

type Event = {
id: string;
creator_id: string;
category_id: string | null;
title: string;
slug: string;
description: string | null;
cover_image: string | null;
venue_name: string | null;
address: string | null;
city: string | null;
state: string | null;
country: string | null;
is_online: boolean;
online_url: string | null;
start_at: string;
end_at: string | null;
status: string;
views: number;
participant_count: number;
created_at: string;
category?: Category | null;
};

type CampaignTemplate = {
id: string;
campaign_id: string;
name: string;
asset_url: string;
width: number;
height: number;
canvas_config: Record<string, unknown> | null;
version: number;
is_active: boolean;
};

type Campaign = {
id: string;
event_id: string;
creator_id: string;
title: string;
slug: string;
description: string | null;
status: string;
views: number;
generations: number;
downloads: number;
participants: number;
created_at: string;
event?: Event | null;
template?: CampaignTemplate | null;
};

const fallbackCategories = [
"All",
"Technology",
"Business",
"Creative",
"Music",
"Education",
"Church",
];

export default function DiscoverPage() {
const supabase = createClient();

const [events, setEvents] = useState<Event[]>([]);
const [campaigns, setCampaigns] = useState<Campaign[]>([]);
const [categories, setCategories] = useState<Category[]>([]);

const [activeCategory, setActiveCategory] =
useState("All");

const [loading, setLoading] =
useState(true);

const [error, setError] =
useState("");

/*

* ---
* LOAD DISCOVER DATA
* ---

*/

useEffect(() => {
async function loadDiscover() {
setLoading(true);
setError("");

  try {
    /*
     * ------------------------------------------------
     * 1. CATEGORIES
     * ------------------------------------------------
     */

    const {
      data: categoryData,
      error: categoryError,
    } = await supabase
      .from("event_categories")
      .select(
        "id, name, slug, icon"
      )
      .order("name", {
        ascending: true,
      });

    if (categoryError) {
      console.error(
        "Category error:",
        categoryError
      );
    }

    const loadedCategories =
      (categoryData ||
        []) as Category[];

    setCategories(
      loadedCategories
    );

    /*
     * ------------------------------------------------
     * 2. PUBLISHED EVENTS
     * ------------------------------------------------
     *
     * IMPORTANT:
     * There is deliberately NO creator_id filter.
     *
     * Supabase RLS already allows public users
     * to read published events.
     * ------------------------------------------------
     */

    const {
      data: eventData,
      error: eventError,
    } = await supabase
      .from("events")
      .select(`
        id,
        creator_id,
        category_id,
        title,
        slug,
        description,
        cover_image,
        venue_name,
        address,
        city,
        state,
        country,
        is_online,
        online_url,
        start_at,
        end_at,
        status,
        views,
        participant_count,
        created_at
      `)
      .eq(
        "status",
        "published"
      )
      .order("start_at", {
        ascending: true,
      });

    if (eventError) {
      throw eventError;
    }

    /*
     * Attach category data manually.
     *
     * This avoids depending on a nested
     * Supabase relationship response.
     */

    const formattedEvents: Event[] =
      (eventData || []).map(
        (event: any) => {
          const category =
            loadedCategories.find(
              (item) =>
                item.id ===
                event.category_id
            ) || null;

          return {
            ...event,
            category,
          };
        }
      );

    setEvents(
      formattedEvents
    );

    /*
     * ------------------------------------------------
     * 3. PUBLISHED CAMPAIGNS
     * ------------------------------------------------
     *
     * Again, NO creator_id filter.
     *
     * This is the important part that makes
     * campaigns public.
     * ------------------------------------------------
     */

    const {
      data: campaignData,
      error: campaignError,
    } = await supabase
      .from("campaigns")
      .select(`
        id,
        event_id,
        creator_id,
        title,
        slug,
        description,
        status,
        views,
        generations,
        downloads,
        participants,
        created_at
      `)
      .eq(
        "status",
        "published"
      )
      .order("created_at", {
        ascending: false,
      });

    if (campaignError) {
      throw campaignError;
    }

    const rawCampaigns =
      (campaignData ||
        []) as Campaign[];

    /*
     * ------------------------------------------------
     * 4. GET PARENT EVENTS FOR CAMPAIGNS
     * ------------------------------------------------
     */

    const campaignEventIds =
      Array.from(
        new Set(
          rawCampaigns
            .map(
              (campaign) =>
                campaign.event_id
            )
            .filter(Boolean)
        )
      );

    let campaignEvents: Event[] =
      [];

    if (
      campaignEventIds.length >
      0
    ) {
      const {
        data: campaignEventData,
        error:
          campaignEventError,
      } = await supabase
        .from("events")
        .select(`
          id,
          creator_id,
          category_id,
          title,
          slug,
          description,
          cover_image,
          venue_name,
          address,
          city,
          state,
          country,
          is_online,
          online_url,
          start_at,
          end_at,
          status,
          views,
          participant_count,
          created_at
        `)
        .in(
          "id",
          campaignEventIds
        );

      if (
        campaignEventError
      ) {
        throw campaignEventError;
      }

      campaignEvents =
        (campaignEventData ||
          []).map(
          (event: any) => {
            const category =
              loadedCategories.find(
                (item) =>
                  item.id ===
                  event.category_id
              ) || null;

            return {
              ...event,
              category,
            };
          }
        );
    }

    /*
     * ------------------------------------------------
     * 5. GET ACTIVE CAMPAIGN TEMPLATES
     * ------------------------------------------------
     *
     * This was missing from the previous version.
     *
     * campaign_templates contains the actual DP
     * artwork used by the campaign.
     * ------------------------------------------------
     */

    const campaignIds =
      rawCampaigns.map(
        (campaign) =>
          campaign.id
      );

    let templates: CampaignTemplate[] =
      [];

    if (
      campaignIds.length >
      0
    ) {
      const {
        data: templateData,
        error: templateError,
      } = await supabase
        .from(
          "campaign_templates"
        )
        .select(`
          id,
          campaign_id,
          name,
          asset_url,
          width,
          height,
          canvas_config,
          version,
          is_active
        `)
        .in(
          "campaign_id",
          campaignIds
        )
        .eq(
          "is_active",
          true
        )
        .order("version", {
          ascending: false,
        });

      if (templateError) {
        console.error(
          "Template error:",
          templateError
        );
      }

      templates =
        (templateData ||
          []) as CampaignTemplate[];
    }

    /*
     * ------------------------------------------------
     * 6. COMBINE EVERYTHING
     * ------------------------------------------------
     */

    const formattedCampaigns =
      rawCampaigns
        .map(
          (campaign) => {
            const parentEvent =
              campaignEvents.find(
                (event) =>
                  event.id ===
                  campaign.event_id
              ) || null;

            /*
             * Because templates are ordered
             * by version descending, the first
             * matching template is the latest.
             */

            const template =
              templates.find(
                (item) =>
                  item.campaign_id ===
                  campaign.id
              ) || null;

            return {
              ...campaign,
              event:
                parentEvent,
              template,
            };
          }
        )
        /*
         * Only expose campaigns attached to
         * published events.
         */
        .filter(
          (campaign) =>
            campaign.event
              ?.status ===
            "published"
        );

    setCampaigns(
      formattedCampaigns
    );
  } catch (err: any) {
    console.error(
      "Discover error:",
      err
    );

    setError(
      err?.message ||
        "Unable to load discover data."
    );
  } finally {
    setLoading(false);
  }
}

loadDiscover();


}, [supabase]);

/*

* ---
* CATEGORY LIST
* ---

*/

const filterCategories =
useMemo(() => {
const databaseCategories =
categories.map(
(category) =>
category.name
);


  const merged = [
    ...fallbackCategories,
    ...databaseCategories,
  ];

  return Array.from(
    new Set(merged)
  );
}, [categories]);


/*

* ---
* FILTER EVENTS
* ---

*/

const filteredEvents =
useMemo(() => {
if (
activeCategory ===
"All"
) {
return events;
}


  return events.filter(
    (event) =>
      event.category?.name
        ?.toLowerCase() ===
      activeCategory.toLowerCase()
  );
}, [
  events,
  activeCategory,
]);


/*

* ---
* FILTER CAMPAIGNS
* ---

*/

const filteredCampaigns =
useMemo(() => {
if (
activeCategory ===
"All"
) {
return campaigns;
}


  return campaigns.filter(
    (campaign) =>
      campaign.event?.category?.name
        ?.toLowerCase() ===
      activeCategory.toLowerCase()
  );
}, [
  campaigns,
  activeCategory,
]);


/*

* ---
* HELPERS
* ---

*/

function formatDate(
date: string
) {
return new Intl.DateTimeFormat(
"en-US",
{
month: "short",
day: "numeric",
year: "numeric",
}
).format(
new Date(date)
);
}

function formatTime(
date: string
) {
return new Intl.DateTimeFormat(
"en-US",
{
hour: "numeric",
minute: "2-digit",
}
).format(
new Date(date)
);
}

function getLocation(
event: Event
) {
if (event.is_online) {
return "Online event";
}


return (
  [
    event.city,
    event.state,
  ]
    .filter(Boolean)
    .join(", ") ||
  event.venue_name ||
  "Location TBA"
);


}

/*

* ---
* LOADING
* ---

*/

if (loading) {
return ( <main className="flex min-h-screen items-center justify-center bg-white"> <div className="text-center">


      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>

      <p className="mt-4 text-sm text-neutral-500">
        Discovering events...
      </p>

    </div>
  </main>
);


}

/*

* ---
* PAGE
* ---

*/

return ( <main className="min-h-screen bg-white">


  {/* HERO */}

  <section className="border-b border-neutral-100">

    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:py-20">

      <div className="max-w-3xl">

        <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">

          <Sparkles className="h-3.5 w-3.5" />

          Discover

        </div>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">

          Find something worth

          <span className="block text-violet-600">
            showing up for.
          </span>

        </h1>

        <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-500 sm:text-lg">
          Discover events happening around you
          and campaigns you can be part of.
        </p>

      </div>

    </div>

  </section>

  {/* DISCOVER */}

  <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">

    {/* FILTERS */}

    <div className="flex gap-2 overflow-x-auto pb-2">

      {filterCategories.map(
        (category) => {

          const active =
            activeCategory ===
            category;

          return (
            <button
              key={category}
              type="button"
              onClick={() =>
                setActiveCategory(
                  category
                )
              }
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-neutral-950 text-white"
                  : "border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
              }`}
            >
              {category}
            </button>
          );
        }
      )}

    </div>

    {/* ERROR */}

    {error && (
      <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    )}

    {/* =========================================
        CAMPAIGNS
       ========================================= */}

    {filteredCampaigns.length >
      0 && (
      <section className="mt-10">

        <div className="flex items-end justify-between gap-5">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
              ATTEND
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Campaigns you can join
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Create your personalized event DP.
            </p>

          </div>

        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {filteredCampaigns.map(
            (campaign) => {

              const artwork =
                campaign
                  .template
                  ?.asset_url;

              const eventCover =
                campaign
                  .event
                  ?.cover_image;

              return (
                <Link
                  key={
                    campaign.id
                  }
                  href={`/campaign/${campaign.slug}?source=discover`}
                  className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-100"
                >

                  {/* ARTWORK */}

                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">

                    {artwork ? (
                      <img
                        src={
                          artwork
                        }
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : eventCover ? (
                      <img
                        src={
                          eventCover
                        }
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-neutral-300" />
                      </div>
                    )}

                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-violet-700 backdrop-blur">
                      Create your DP
                    </div>

                  </div>

                  {/* DETAILS */}

                  <div className="p-5">

                    <div className="flex items-center justify-between gap-3">

                      <span className="text-xs font-semibold text-violet-600">
                        {campaign
                          .event
                          ?.category
                          ?.name ||
                          "Event"}
                      </span>

                      <ArrowRight className="h-4 w-4 text-neutral-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />

                    </div>

                    <h3 className="mt-2 text-lg font-semibold tracking-tight text-neutral-950">
                      {
                        campaign.title
                      }
                    </h3>

                    {campaign
                      .event && (
                      <p className="mt-1 truncate text-sm text-neutral-500">
                        {
                          campaign
                            .event
                            .title
                        }
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">

                      <span>
                        {
                          campaign.participants ||
                          0
                        }{" "}
                        participant
                        {campaign.participants ===
                        1
                          ? ""
                          : "s"}
                      </span>

                      <span>
                        {
                          campaign.generations ||
                          0
                        }{" "}
                        generated
                      </span>

                    </div>

                  </div>

                </Link>
              );
            }
          )}

        </div>

      </section>
    )}

    {/* =========================================
        EVENTS
       ========================================= */}

    <section
      className={
        filteredCampaigns.length
          ? "mt-14"
          : "mt-10"
      }
    >

      <div className="flex items-end justify-between gap-5">

        <div>

          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
            EVENTS
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Upcoming events
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Find events worth attending.
          </p>

        </div>

      </div>

      {filteredEvents.length >
      0 ? (

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          {filteredEvents.map(
            (event) => (

              <Link
                key={
                  event.id
                }
                href={`/events/${event.slug}`}
                className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-100"
              >

                {/* COVER */}

                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">

                  {event.cover_image ? (

                    <img
                      src={
                        event.cover_image
                      }
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                  ) : (

                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 to-neutral-100">
                      <CalendarDays className="h-8 w-8 text-violet-300" />
                    </div>

                  )}

                  {event.category
                    ?.name && (

                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-violet-700 backdrop-blur">
                      {
                        event
                          .category
                          .name
                      }
                    </span>

                  )}

                </div>

                {/* DETAILS */}

                <div className="p-5">

                  <div className="flex items-start justify-between gap-4">

                    <h3 className="text-lg font-semibold tracking-tight text-neutral-950">
                      {
                        event.title
                      }
                    </h3>

                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />

                  </div>

                  <div className="mt-4 space-y-2.5 text-sm text-neutral-500">

                    <div className="flex items-center gap-2">

                      <CalendarDays className="h-4 w-4 shrink-0" />

                      <span>
                        {formatDate(
                          event.start_at
                        )}{" "}
                        ·{" "}
                        {formatTime(
                          event.start_at
                        )}
                      </span>

                    </div>

                    <div className="flex items-center gap-2">

                      <MapPin className="h-4 w-4 shrink-0" />

                      <span className="truncate">
                        {getLocation(
                          event
                        )}
                      </span>

                    </div>

                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs text-neutral-400">

                    <span>
                      {
                        event.participant_count
                      }{" "}
                      attending
                    </span>

                    <span className="font-medium text-neutral-500">
                      View event
                    </span>

                  </div>

                </div>

              </Link>

            )
          )}

        </div>

      ) : (

        <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-14 text-center">

          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-400 shadow-sm">
            <CalendarDays className="h-5 w-5" />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-neutral-900">
            No events found
          </h3>

          <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-neutral-500">
            There are no published events in
            this category yet.
          </p>

          {activeCategory !==
            "All" && (

            <button
              type="button"
              onClick={() =>
                setActiveCategory(
                  "All"
                )
              }
              className="mt-4 text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              View all events
            </button>

          )}

        </div>

      )}

    </section>

    {/* =========================================
        NOTHING FOUND
       ========================================= */}

    {filteredEvents.length ===
      0 &&
      filteredCampaigns.length ===
        0 && (

      <div className="mt-10 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-16 text-center">

        <Sparkles className="mx-auto h-7 w-7 text-neutral-300" />

        <h3 className="mt-4 text-sm font-semibold">
          Nothing here yet
        </h3>

        <p className="mt-1 text-sm text-neutral-500">
          Try another category.
        </p>

        {activeCategory !==
          "All" && (

          <button
            type="button"
            onClick={() =>
              setActiveCategory(
                "All"
              )
            }
            className="mt-4 text-sm font-semibold text-violet-600 hover:text-violet-700"
          >
            View everything
          </button>

        )}

      </div>

    )}

  </section>

</main>


);
}