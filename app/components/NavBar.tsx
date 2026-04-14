import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function NavBar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  return (
    <nav className="border-b border-white/10 bg-black text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        {/* LOGO */}
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/logo.png"
            alt="DormSweep Logo"
            width={120}
            height={52}
            priority
          />
        </Link>

        {/* NAV LINKS */}
        <div className="flex items-center gap-5 text-sm font-medium">

          <Link href="/" className="text-white hover:text-gray-300">
            Home
          </Link>

          <Link href="/browse" className="text-white hover:text-gray-300">
            Browse
          </Link>

          <Link href="/list" className="text-white hover:text-gray-300">
            List
          </Link>

          {isLoggedIn ? (
            <>
              <Link href="/profile" className="text-white hover:text-gray-300">
                Profile
              </Link>

              <span className="hidden text-gray-400 md:inline">
                {user.email}
              </span>

              <form action="/auth/signout" method="post">
                <button className="rounded-lg border border-white/20 px-3 py-1.5 hover:bg-white/10">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-white/20 px-3 py-1.5 hover:bg-white/10"
            >
              Log in
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}