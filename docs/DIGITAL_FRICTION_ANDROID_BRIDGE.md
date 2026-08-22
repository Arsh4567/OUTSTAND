# OUTSTAND Digital Friction — Android bridge contract

The web app cannot directly read Android Digital Wellbeing data. The production integration should use a small native Android companion or Android wrapper that exposes a read-only JavaScript bridge named `window.OutstandAndroidUsage`.

## JavaScript contract

```ts
window.OutstandAndroidUsage = {
  async getDailyUsage(startMs, endMs) {
    return {
      source: "android",
      date: "YYYY-MM-DD",
      screenMinutes: 0,
      distractionMinutes: 0,
      topApp: undefined,
      peakWindow: undefined,
      apps: [],
      updatedAt: new Date().toISOString(),
    };
  },
};
```

Only aggregated usage needed by Digital Friction should cross the bridge. Do not expose message content, contacts, files, passwords, or unrelated device data.

## Android implementation notes

Use `UsageStatsManager` with `queryAndAggregateUsageStats` or `queryUsageStats` for the current day. The native app must declare `android.permission.PACKAGE_USAGE_STATS`, then send the user to Android's Usage Access settings so the user explicitly grants access.

The native layer should map package names to friendly app names and classify only the minimum categories needed for Digital Friction. Keep raw package-level data on-device where possible and send OUTSTAND aggregated totals.

## Browser fallback

If the bridge is unavailable, the web app must remain fully usable. It provides a manual screen-time and distraction-time entry instead of pretending that browser permissions can access Digital Wellbeing.
