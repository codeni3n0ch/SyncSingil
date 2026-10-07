import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SyncSINGIL | Microloan Management System",
  description: "Microloan collection and borrower management system"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
