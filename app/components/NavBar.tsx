"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function NavBar() {
  const supabase = createClient();
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

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
        {isActive && (
          <span className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full bg-gradient-to-r from-blue-500 to-orange-400" />
        )}
      </Link>
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-white/80 shadow-sm backdrop-blur-md">
      <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 via-orange-400 to-blue-500" />

      <div className="mx-auto flex max-w-6xl items-center justify-between border-b border-gray-200 px-6 py-4">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/logo.png"
            alt="DormSweep Logo"
            width={110}
            height={48}
            priority
            className="object-contain"
          />
        </Link>

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

              <button
                onClick={handleLogout}
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Log out
              </button>
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