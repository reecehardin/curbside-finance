import type { Metadata } from "next";
import { Saira, Saira_Condensed } from "next/font/google";
import "./globals.css";

const body = Saira({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const display = Saira_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Curbside LA — Finance",
  description: "Income & expense tracker for the Curbside LA FiveM server",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
