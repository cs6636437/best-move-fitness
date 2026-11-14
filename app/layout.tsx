import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BEST — stronger, every day",
  description: "วางแผนการฝึกและติดตามความก้าวหน้าของคุณ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
