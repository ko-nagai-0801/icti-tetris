"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function StoreHydrator() {
  const hydrate = useAppStore((state) => state.hydrateFromStorage);
  const hydrated = useAppStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
    }
  }, [hydrate, hydrated]);

  return null;
}
