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
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/logo.png"
            alt="DormSweep Logo"
            width={120}
            height={52}
            priority
          />
        </Link>

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

          {isLoggedIn ? (
            <>
              <Link href="/profile" className="hover:text-black">
                Profile
              </Link>

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