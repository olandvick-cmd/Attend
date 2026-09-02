"use client";

import Link from "next/link";
import { Home, Compass, Plus } from "lucide-react";

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-100 bg-white/95 px-5 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        <Link
          href="/"
          className="flex flex-col items-center gap-1 text-xs font-medium text-violet-600"
        >
          <Home className="h-5 w-5" strokeWidth={2} />
          Home
        </Link>

        <Link
          href="/discover"
          className="flex flex-col items-center gap-1 text-xs font-medium text-neutral-400"
        >
          <Compass className="h-5 w-5" strokeWidth={2} />
          Discover
        </Link>

        <Link
          href="/create"
          className="flex flex-col items-center gap-1 text-xs font-medium text-neutral-400"
        >
          <div className="flex h-11 w-11 -translate-y-3 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-200">
            <Plus className="h-5 w-5" />
          </div>

          <span className="-mt-3">Create</span>
        </Link>
      </div>
    </nav>
  );
}