
"use client";
import { useCallback } from "react";
import type { Id } from "../../convex/_generated/dataModel";

type ActivityEvent = {
  type: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
};

export function useActivityTracker(partnerId: Id<"partners">) {
  const key = `activity:${String(partnerId)}`;

  const track = useCallback((event: Omit<ActivityEvent, "timestamp">) => {
    try {
      const now = new Date().toISOString();
      const storedRaw = localStorage.getItem(key) ?? "[]";
      const list: ActivityEvent[] = JSON.parse(storedRaw);
      list.push({ ...event, timestamp: now });
      localStorage.setItem(key, JSON.stringify(list));
      // small console trace for dev
      // replace with convex mutation when server-side table + mutation exist
      console.log("[ActivityTracker] tracked", { ...event, timestamp: now });
    } catch (e) {
      console.error("[ActivityTracker] failed to track event", e);
    }
  }, [key]);

  return { track };
}
