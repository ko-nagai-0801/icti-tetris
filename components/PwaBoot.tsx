"use client";

import { useEffect } from "react";

export function PwaBoot() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker is optional; failure should not block the app.
    });
  }, []);

  return null;
}
