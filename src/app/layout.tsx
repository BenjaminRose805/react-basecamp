import { Providers } from "./providers";

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Development Platform",
  description: "Unified platform for AI-assisted software development",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
