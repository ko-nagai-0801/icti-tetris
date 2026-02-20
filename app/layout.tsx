import type { Metadata } from "next";
import { StoreHydrator } from "@/components/StoreHydrator";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICTI Tetris Protocol",
  description: "Guided protocol session with rotation task and Tetris"
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
