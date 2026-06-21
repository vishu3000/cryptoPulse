"use client";
import { useEffect, useRef, useCallback } from "react";

export function usePolling(fetcher: () => Promise<void>, intervalMs = 15_000) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stableFetcher = useRef(fetcher);
  stableFetcher.current = fetcher;

  const schedule = useCallback(() => {
    timer.current = setTimeout(async () => {
      if (document.visibilityState === "hidden") {
        schedule();
        return;
      }
      await stableFetcher.current().catch(console.error);
      schedule();
    }, intervalMs);
  }, [intervalMs]);

  useEffect(() => {
    schedule();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [schedule]);
}
