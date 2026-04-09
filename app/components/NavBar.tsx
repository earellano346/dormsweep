"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsLoggedIn(!!session);
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
        {isLoggedIn ? (
          <>
            <div className="flex-1">
              <Link href="/" className="inline-flex items-center">
                <Image
                  src="/logo.png"
                  alt="DormSweep Logo"
                  width={120}
                  height={52}
                  priority
                />
              </Link>
            </div>

            <div className="flex items-center gap-5 text-sm font-medium text-gray-700">
              <Link href="/" className="hover:text-black">
                Home
              </Link>
              <Link href="/browse" className="hover:text-black">
                Browse
              </Link>
              <Link href="/list" className="hover:text-black">
                List
              </Link>
              <Link href="/profile" className="hover:text-black">
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Log out
              </button>
            </div>
          </>
        ) : (
          <div className="flex w-full justify-center">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo.png"
                alt="DormSweep Logo"
                width={120}
                height={52}
                priority
              />
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}