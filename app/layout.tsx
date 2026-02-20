import type { Metadata, Viewport } from "next";
import { StoreHydrator } from "@/components/StoreHydrator";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICTI Tetris Protocol",
  description: "Guided protocol session with rotation task and Tetris"
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
        <StoreHydrator />
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
