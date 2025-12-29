import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube MP4 fetcher",
  description: "Скачиваем MP4 ссылку с YouTube через RapidAPI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-background">{children}</body>
    </html>
  );
}
