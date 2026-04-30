import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DodoLaunch India",
  description:
    "Launchpad for Indian AI and SaaS builders to sell with Dodo Payments and split revenue on Solana.",
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
