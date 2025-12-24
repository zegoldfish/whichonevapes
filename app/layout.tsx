import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { AppHeader } from "./components/AppHeader";

export const metadata: Metadata = {
  title: "Which One Vapes",
  description: "Decide which one vapes.",
};

export const viewport = {
  initialScale: 1,
  width: "device-width",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppHeader />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
