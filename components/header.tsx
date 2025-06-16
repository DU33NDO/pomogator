"use client";

import { Button } from "@/components/ui/button";
import { Shapes, Menu, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          className="flex items-center space-x-4"
          href="/"
          onClick={closeMobileMenu}
        >
          <Shapes className="h-8 w-8" />
          <span className="font-bold text-xl">Pomogator</span>
        </Link>

        {/* Desktop Navigation */}
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="block text-gray-600 hover:text-gray-900 py-2"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
                <Link
                  href="/assignments"
                  className="block text-gray-600 hover:text-gray-900 py-2"
                  onClick={closeMobileMenu}
                >
                  Assignments
                </Link>
                <Link
                  href="/teams"
                  className="block text-gray-600 hover:text-gray-900 py-2"
                  onClick={closeMobileMenu}
                >
                  Teams
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    logout();
                    closeMobileMenu();
                  }}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push("/login");
                    closeMobileMenu();
                  }}
                  className="w-full mb-2"
                >
                  Sign In
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push("/register");
                    closeMobileMenu();
                  }}
                  className="w-full"
                >
                  Register
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
