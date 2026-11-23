import { useEffect, useRef, useState, type RefObject } from "react";

const THRESHOLD = 72;

export function usePullToRefresh(area: RefObject<HTMLElement | null>, onRefresh: () => Promise<void> | void) {
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let startY = 0;
    let tracking = false;
    let pulled = 0;
    let refreshingNow = false;

    const atTop = () => window.scrollY <= 0;

    const onDown = (event: PointerEvent) => {
      if (refreshingNow || !atTop()) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const root = area.current;
      if (!root || !(event.target instanceof Node) || !root.contains(event.target)) return;
      startY = event.clientY;
      tracking = true;
      pulled = 0;
    };

    const onMove = (event: PointerEvent) => {
      if (!tracking) return;
      if (!atTop()) {
        tracking = false;
        pulled = 0;
        setDistance(0);
        return;
      }
      const dy = event.clientY - startY;
      if (dy <= 0) {
        pulled = 0;
        setDistance(0);
        return;
      }
      pulled = Math.min(dy, 110);
      setDistance(pulled);
      if (pulled > 12 && event.cancelable) event.preventDefault();
    };

    const finish = () => {
      if (!tracking) return;
      tracking = false;
      const shouldRefresh = pulled >= THRESHOLD;
      pulled = 0;
      setDistance(0);
      if (!shouldRefresh || refreshingNow) return;
      refreshingNow = true;
      setRefreshing(true);
      void Promise.resolve(refreshRef.current()).finally(() => {
        refreshingNow = false;
        setRefreshing(false);
      });
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
  }, [area]);

  return {
    refreshing,
    open: refreshing || distance > 8,
    label: refreshing ? "Refreshing…" : distance >= THRESHOLD ? "Release to refresh" : "Pull to refresh"
  };
}
