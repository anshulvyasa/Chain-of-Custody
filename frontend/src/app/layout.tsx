import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Web3Provider } from "@/components/Web3Provider";
import StoreProvider from "@/providers/store_provider";

export const metadata: Metadata = {
  title: "Chain of Custody",
  description: "Decentralized legal investigator evidence tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          <StoreProvider>
            {children}
          </StoreProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
