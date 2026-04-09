"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  image_url: string | null;
  status: string | null;
  school_id: string;
};

export default function Home() {
  const supabase = createClient();
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadListings() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setFeatured([]);
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.school_id) {
        console.error(profileError?.message || "No school found");
        setFeatured([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .eq("school_id", profile.school_id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error(error.message);
        setFeatured([]);
      } else {
        setFeatured(data ?? []);
      }

      setLoading(false);
    }

    loadListings();
  }, []);

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="animate-fade-in space-y-8">
        {/* Hero Card */}
        <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-md">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
              Student marketplace • campus-only access
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl bg-gradient-to-r from-black via-gray-800 to-gray-500 bg-clip-text text-transparent">
              Buy, sell, and sweep up dorm essentials on your campus.
            </h1>

            <p className="mt-4 max-w-2xl text-base text-gray-600 md:text-lg">
              DormSweep makes it easy for students to find affordable dorm items,
              post listings quickly, and buy from people at their own school.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/browse"
                className="rounded-xl bg-black px-5 py-3 font-medium text-white transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Browse your campus
              </Link>

              <Link
                href="/list"
                className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium text-gray-900 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                List an item
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold">Campus-only</p>
                <p className="mt-1 text-xs text-gray-500">
                  School-based access tied to .edu emails
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold">Fast listings</p>
                <p className="mt-1 text-xs text-gray-500">
                  Upload photos and post within minutes
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold">Built for move-out</p>
                <p className="mt-1 text-xs text-gray-500">
                  Perfect for cheap dorm finds and easy reselling
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">🔥 Trending on your campus</h2>
              <p className="mt-1 text-sm text-gray-600">
                The latest listings students at your school are posting right now.
              </p>
            </div>

            <Link
              href="/browse"
              className="hidden rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:shadow-md sm:inline-flex"
            >
              See all
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-gray-600">Loading...</p>
          ) : featured.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="font-medium text-gray-700">No listings yet.</p>
              <p className="mt-1 text-sm text-gray-500">
                Once people at your school start posting, they’ll show up here.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((item) => (
                <Link
                  key={item.id}
                  href={`/listing/${item.id}`}
                  className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="mb-3 h-36 w-full rounded-xl bg-gray-100 object-contain"
                    />
                  ) : (
                    <div className="mb-3 h-36 rounded-xl bg-gray-100" />
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 font-semibold transition group-hover:text-gray-700">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-sm font-bold">
                      ${((item.price_cents ?? 0) / 100).toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    Tap to view listing
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}