import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayMeter",
  description: "Metering and entitlement engine for pay-per-use products powered by Nomba.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
