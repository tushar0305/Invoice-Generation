// Analytics removed per project settings.
// This file intentionally exports no-op functions so any imports stay safe.

export type AnalyticsEvent = {
  type: string;
  timestamp: number;
  pathname?: string;
  payload?: Record<string, any>;
};

export async function track(_type: string, _payload?: Record<string, any>) {
  // no-op
}

export function initHeatmap() {
  // no-op
  return () => {};
}

export function trackPageView() {
  // no-op
}
