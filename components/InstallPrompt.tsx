"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const isIosSafari = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent.toLowerCase();
  const ios = /iphone|ipad|ipod/.test(ua);
  const webkit = /safari/.test(ua) && !/crios|fxios|edgios|android/.test(ua);
  return ios && webkit;
};

const isStandalone = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const mediaStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  const iosStandalone = Boolean(nav.standalone);
  return mediaStandalone || iosStandalone;
};

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event): void => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = (): void => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const showIosGuide = useMemo(() => {
    return !installed && !deferredPrompt && isIosSafari();
  }, [deferredPrompt, installed]);

  if (installed) {
    return (
      <section className="card">
        <p className="help">ホーム画面に追加済みです。アプリとして起動できます。</p>
      </section>
    );
  }

  if (deferredPrompt) {
    return (
      <section className="card column">
        <h2>アプリとして使う</h2>
        <p className="help">ホーム画面に追加すると、iPhoneでもフルスクリーンで使えます。</p>
        <button
          type="button"
          className="btn-outline"
          onClick={async () => {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === "accepted") {
              setDeferredPrompt(null);
            }
          }}
        >
          ホーム画面に追加
        </button>
      </section>
    );
  }

  if (showIosGuide) {
    return (
      <section className="card column">
        <h2>iPhoneでアプリ化する</h2>
        <p className="help">Safariの共有メニューから「ホーム画面に追加」を選ぶと、アプリのように使えます。</p>
      </section>
    );
  }

  return null;
}
