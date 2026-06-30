"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useWallet } from "./WalletContext";
import { useNotifications } from "@/hooks/useNotifications";
import { EVENT_ICONS, EVENT_LABELS } from "@/lib/notifications";

export default function NotificationBell() {
  const { publicKey } = useWallet();
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications(publicKey);
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!publicKey) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex size-9 items-center justify-center rounded-full border border-black/10 bg-white text-zinc-950 hover:bg-black/5 dark:border-white/15 dark:bg-zinc-800 dark:text-white dark:hover:bg-white/10 transition-colors shadow-sm"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No notifications yet
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/causes/${n.campaignId}`}
                      onClick={() => {
                        markRead(n.id);
                        setIsOpen(false);
                      }}
                      className={`flex items-start gap-3 px-4 py-3 text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${n.read ? "opacity-60" : ""}`}
                    >
                      <span className="mt-0.5 text-base">
                        {EVENT_ICONS[n.type]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-700 dark:text-zinc-300">
                          {n.message}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                          {EVENT_LABELS[n.type]}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
