import type React from "react";
import { Geist, Azeret_Mono as Geist_Mono } from "next/font/google";
import "./globals.css";
import "../styles/markdown.css";
import { AuthProvider } from "../contexts/AuthContext";
import Header from "@/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
