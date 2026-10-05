import type { Metadata, Viewport } from "next";
import { Rajdhani, Share_Tech_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

// Self-hosted at build time by next/font: no runtime requests to Google.
const num = Rajdhani({ weight: ["500", "600", "700"], subsets: ["latin"], variable: "--font-num-face", display: "swap" });
const mono = Share_Tech_Mono({ weight: "400", subsets: ["latin"], variable: "--font-mono-face", display: "swap" });
const jp = Zen_Kaku_Gothic_New({ weight: ["400", "500", "700"], subsets: ["latin"], variable: "--font-jp-face", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "JARVIS Business OS",
  description: "朝の報告、事業の数字、人の承認を一画面で扱う業務OS（ローカルDEMO）。",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 34'><circle cx='17' cy='17' r='15' fill='%2301060c' stroke='%2356c8ff' stroke-width='2'/><circle cx='17' cy='17' r='5' fill='%23b8ecff'/></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#01060c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${num.variable} ${mono.variable} ${jp.variable}`}>
      <body>{children}</body>
    </html>
  );
}
