import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Background } from "@/components/Background";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "i-Age · Age Smarter, Not Faster",
  description: "Estimate your biological age from physical tests, blood work and DNA, on one dashboard.",
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#060920" }, { media: "(prefers-color-scheme: light)", color: "#e8edff" }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Background />
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
