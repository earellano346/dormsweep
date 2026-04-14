"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function NavBar() {
  const supabase = createClient();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }

    loadUser();
  }, []);

  const isLoggedIn = !!user;

  function navLink(href: string, label: string) {
    const isActive = pathname === href;

    return (
      <Link
        href={href}
        className={`relative transition ${
          isActive
            ? "text-black font-semibold"
            : "text-gray-700 hover:text-blue-600"
        }`}
      >
        {label}

        {/* active underline */}
        {isActive && (
          <span className="absolute -bottom-1 left-0 h-[2px] w-full bg-gradient-to-r from-blue-500 to-orange-400 rounded-full" />
        )}
      </Link>
    );
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm">
      {/* gradient accent bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 via-orange-400 to-blue-500" />

      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 border-b border-gray-200">

        {/* LOGO */}
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/logo.png"
            alt="DormSweep Logo"
            width={110}
            height={48}
            priority
            className="h-auto w-[110px] object-contain"
          />
        </Link>

        {/* NAV LINKS */}
        <div className="flex items-center gap-5 text-sm font-medium">

          {navLink("/", "Home")}
          {navLink("/browse", "Browse")}
          {navLink("/list", "List")}

          {isLoggedIn ? (
            <>
              {navLink("/profile", "Profile")}

              <span className="hidden text-gray-500 md:inline">
                {user.email}
              </span>

              <form action="/auth/signout" method="post">
                <button className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}