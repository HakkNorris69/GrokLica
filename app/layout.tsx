import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "GrokLica",
  description: "Super Grok replica chat",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
