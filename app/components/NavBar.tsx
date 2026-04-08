"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NavBar() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* LOGO ONLY */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="DormSweep Logo"
            width={140}
            height={60}
            priority
          />
        </Link>

        {/* NAV LINKS */}
        <div className="flex gap-4 items-center">
          <Link href="/">Home</Link>
          <Link href="/browse">Browse</Link>
          <Link href="/list">List</Link>

          {isLoggedIn ? (
            <>
              <Link href="/profile">Profile</Link>
              <button
                onClick={handleLogout}
                className="border px-3 py-1 rounded-lg"
              >
                Log out
              </button>
            </>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}