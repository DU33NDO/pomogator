"use client";

import type React from "react";
import { Geist, Azeret_Mono as Geist_Mono } from "next/font/google";
import "./globals.css";
import { Button } from "@/components/ui/button";
import { Shapes } from "lucide-react";
import Link from "next/link";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function Header() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link className="flex items-center space-x-4" href="/">
          <Shapes className="h-8 w-8" />
          <span className="font-bold text-xl">Pomogator</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/assignments"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Assignments
              </Link>
              <Link
                href="/teams"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Teams
              </Link>
              <Button variant="outline" onClick={logout}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => router.push("/login")}>
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/register")}
              >
                Register
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = () => {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken || !refreshToken) {
        setIsAuthenticated(false);
        setLoading(false);
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/register"
        ) {
          router.push("/login");
        }
        return;
      }

      try {
        const token = JSON.parse(atob(accessToken.split(".")[1]));
        const expiry = token.exp * 1000;

        if (Date.now() >= expiry) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setIsAuthenticated(false);
          router.push("/login");
        } else {
          setUser(token);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Token validation error:", error);
        setIsAuthenticated(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

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
