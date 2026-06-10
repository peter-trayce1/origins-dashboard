"use client";

import { useEffect, useRef, useState } from "react";

export type BrandMemoryKind = "suppliers" | "care_instructions";

/**
 * Per-brand "previously used" memory, stored server-side (table: brand_memory),
 * scoped to the authenticated user's brand via RLS. Strictly isolated per
 * account — never leaks between accounts sharing a browser.
 */
export function useBrandMemory<T>(kind: BrandMemoryKind) {
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);
  const itemsRef = useRef<T[]>([]);

  // Load this brand's memory on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/brand-memory?kind=${kind}`);
        if (res.ok) {
          const json = await res.json();
          const data = Array.isArray(json.data) ? (json.data as T[]) : [];
          if (!cancelled) {
            itemsRef.current = data;
            setItems(data);
          }
        }
      } catch {
        /* ignore — empty memory is a safe fallback */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [kind]);

  // Replace the whole array. Accepts a value or an updater (always reads latest).
  function persist(updater: T[] | ((prev: T[]) => T[])) {
    const next = typeof updater === "function"
      ? (updater as (p: T[]) => T[])(itemsRef.current)
      : updater;
    itemsRef.current = next;
    setItems(next);
    fetch("/api/brand-memory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, data: next }),
    }).catch(() => { /* best-effort save */ });
  }

  return { items, persist, loaded };
}
