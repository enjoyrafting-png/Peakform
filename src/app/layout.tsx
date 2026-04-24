export const dynamic = 'force-dynamic';

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ErrorProvider } from "@/contexts/ErrorContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Peakform - Athletic Performance Management",
  description: "A platform for athletes, coaches, and admins to manage athletic performance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorProvider>
          {children}
        </ErrorProvider>
      </body>
    </html>
  );
}
