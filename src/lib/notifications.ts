export type NotificationEventType =
  "contribution" | "verified" | "refund_available" | "revenue_deposited";

export interface AppNotification {
  id: string;
  type: NotificationEventType;
  campaignId: number;
  campaignTitle: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export type NotificationEventMap = Record<NotificationEventType, string>;

export const EVENT_LABELS: NotificationEventMap = {
  contribution: "Contribution",
  verified: "Campaign Verified",
  refund_available: "Refund Available",
  revenue_deposited: "Revenue Deposited",
};

export const EVENT_ICONS: NotificationEventMap = {
  contribution: "💜",
  verified: "✅",
  refund_available: "💰",
  revenue_deposited: "🏦",
};
