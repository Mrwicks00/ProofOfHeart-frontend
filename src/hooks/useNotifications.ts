"use client";

import { useEffect, useCallback, useRef, useReducer, useMemo } from "react";
import { useContributions } from "./useContributions";
import { getNotificationPreferences } from "@/lib/preferences";
import type { AppNotification } from "@/lib/notifications";
import type { ContributionHistoryItem } from "./useContributions";

function buildNotifications(
  walletAddress: string,
  items: ContributionHistoryItem[],
  prevSnapshot: Map<
    number,
    { canClaimRefund: boolean; canClaimRevenue: boolean; isVerified: boolean }
  >,
): AppNotification[] {
  const now = Date.now();
  const results: AppNotification[] = [];
  const prefs = getNotificationPreferences(walletAddress);

  for (const item of items) {
    const prev = prevSnapshot.get(item.campaign.id);
    const id = item.campaign.id;

    if (
      prefs.verified &&
      item.campaign.is_verified &&
      (!prev || !prev.isVerified)
    ) {
      results.push({
        id: `verified-${id}-${now}`,
        type: "verified",
        campaignId: id,
        campaignTitle: item.campaign.title,
        message: `"${item.campaign.title}" has been verified!`,
        timestamp: now,
        read: false,
      });
    }

    if (
      prefs.refundAvailable &&
      item.canClaimRefund &&
      (!prev || !prev.canClaimRefund)
    ) {
      results.push({
        id: `refund-${id}-${now}`,
        type: "refund_available",
        campaignId: id,
        campaignTitle: item.campaign.title,
        message: `Refund available for "${item.campaign.title}"`,
        timestamp: now,
        read: false,
      });
    }

    if (
      prefs.revenueDeposited &&
      item.canClaimRevenue &&
      (!prev || !prev.canClaimRevenue)
    ) {
      results.push({
        id: `revenue-${id}-${now}`,
        type: "revenue_deposited",
        campaignId: id,
        campaignTitle: item.campaign.title,
        message: `Revenue available to claim for "${item.campaign.title}"`,
        timestamp: now,
        read: false,
      });
    }

    prevSnapshot.set(id, {
      canClaimRefund: item.canClaimRefund,
      canClaimRevenue: item.canClaimRevenue,
      isVerified: item.campaign.is_verified,
    });
  }

  return results;
}

type NotifAction =
  | { type: "append"; items: AppNotification[] }
  | { type: "mark_read"; id: string }
  | { type: "mark_all_read" };

function notifReducer(
  state: AppNotification[],
  action: NotifAction,
): AppNotification[] {
  switch (action.type) {
    case "append": {
      const updated = [...action.items, ...state];
      return updated.slice(0, 50);
    }
    case "mark_read":
      return state.map((n) => (n.id === action.id ? { ...n, read: true } : n));
    case "mark_all_read":
      return state.map((n) => ({ ...n, read: true }));
  }
}

export function useNotifications(walletAddress: string | null) {
  const snapshotRef = useRef<
    Map<
      number,
      { canClaimRefund: boolean; canClaimRevenue: boolean; isVerified: boolean }
    >
  >(new Map());
  const seenRef = useRef<Set<string>>(new Set());
  const [notifications, dispatch] = useReducer(notifReducer, []);

  const { contributions, isLoading } = useContributions(walletAddress);

  useEffect(() => {
    if (!walletAddress) {
      snapshotRef.current.clear();
      seenRef.current.clear();
      return;
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress || isLoading || contributions.length === 0) return;

    const prefs = getNotificationPreferences(walletAddress);
    if (
      !prefs.contributions &&
      !prefs.verified &&
      !prefs.refundAvailable &&
      !prefs.revenueDeposited
    )
      return;

    const newOnes = buildNotifications(
      walletAddress,
      contributions,
      snapshotRef.current,
    ).filter((n) => !seenRef.current.has(n.id));

    if (newOnes.length > 0) {
      newOnes.forEach((n) => seenRef.current.add(n.id));
      dispatch({ type: "append", items: newOnes });
    }
  }, [walletAddress, contributions, isLoading]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const markRead = useCallback(
    (id: string) => dispatch({ type: "mark_read", id }),
    [],
  );
  const markAllRead = useCallback(
    () => dispatch({ type: "mark_all_read" }),
    [],
  );

  const refresh = useCallback(() => {
    seenRef.current.clear();
    snapshotRef.current.clear();
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, refresh };
}
