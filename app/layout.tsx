import { AppErrorBanner } from "@/components/AppErrorBanner";
import { GlobalRuntimeGuard } from "@/components/GlobalRuntimeGuard";
import type { Metadata, Viewport } from "next";
import { PwaBoot } from "@/components/PwaBoot";
import { StoreHydrator } from "@/components/StoreHydrator";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICTI Tetris Protocol",
  description: "Guided protocol session with rotation task and Tetris",
  applicationName: "ICTI Tetris",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ICTI Tetris"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <a href="#main-content" className="skip-link">
          本文へスキップ
        </a>
        <StoreHydrator />
        <PwaBoot />
        <GlobalRuntimeGuard />
        <AppErrorBanner />
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
