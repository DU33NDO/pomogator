"use client";

import { Button } from "@/components/ui/button";
import { Shapes } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Header() {
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
