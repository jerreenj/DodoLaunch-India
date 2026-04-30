import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solana Dodo India",
  description:
    "Stablecoin settlement dashboard for Indian SaaS and AI businesses using Dodo Payments and Solana.",
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

