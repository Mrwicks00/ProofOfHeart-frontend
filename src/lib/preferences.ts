export interface NotificationPreferences {
  contributions: boolean;
  verified: boolean;
  refundAvailable: boolean;
  revenueDeposited: boolean;
}

const STORAGE_KEY_PREFIX = "notif_prefs_";

const DEFAULTS: NotificationPreferences = {
  contributions: true,
  verified: true,
  refundAvailable: true,
  revenueDeposited: true,
};

export function getNotificationPreferences(
  walletAddress: string,
): NotificationPreferences {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(
      `${STORAGE_KEY_PREFIX}${walletAddress.toLowerCase()}`,
    );
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch {
    // ignore corrupt data
  }
  return { ...DEFAULTS };
}

export function setNotificationPreferences(
  walletAddress: string,
  prefs: NotificationPreferences,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${walletAddress.toLowerCase()}`,
    JSON.stringify(prefs),
  );
}
