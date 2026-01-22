import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Recorder App",
  description: "マニュアル音声入力アプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
