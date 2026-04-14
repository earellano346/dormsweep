"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "All",
  "Books",
  "Clothes",
  "Electronics",
  "Furniture",
  "Dorm Essentials",
  "School Supplies",
  "Kitchen",
  "Decor",
  "Sports & Fitness",
  "Other",
];

export default function BrowsePage() {
  const supabase = createClient();

  const [listings, setListings] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setListings([]);
        setFiltered([]);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (!profile?.school_id) {
        setListings([]);
        setFiltered([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .eq("school_id", profile.school_id)
        .order("created_at", { ascending: false });

      const items = data ?? [];

      setListings(items);
      setFiltered(items);
      setLoading(false);
    }

    load();
  }, []);

  // 🔥 FILTER LOGIC (CATEGORY + SEARCH)
  useEffect(() => {
    let result = listings;

    if (selectedCategory !== "All") {
      result = result.filter(
        (item) => item.category === selectedCategory
      );
    }

    if (search.trim() !== "") {
      result = result.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(result);
  }, [selectedCategory, search, listings]);

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6 bg-gray-50">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* HEADER */}
        <section className="rounded-3xl border bg-white/80 p-6 shadow-xl backdrop-blur-md">
          <h1 className="text-3xl font-bold">Browse your campus</h1>
          <p className="mt-1 text-gray-600">
            Find items students at your school are selling.
          </p>

          {/* 🔥 SEARCH BAR */}
          <div className="mt-5">
            <input
              type="text"
              placeholder="Search items (ex: fridge, textbook, chair...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* CATEGORY FILTERS */}
          <div className="mt-5 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm border transition
                  ${
                    selectedCategory === cat
                      ? "bg-black text-white"
                      : "bg-white hover:shadow"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* CONTENT */}
        <section className="rounded-3xl border bg-white/80 p-6 shadow-xl backdrop-blur-md">

          {loading ? (
            <p className="text-gray-500">Loading listings...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl font-semibold">No listings found</p>
              <p className="text-gray-500 mt-2">
                Try another search or category.
              </p>

              <Link
                href="/list"
                className="inline-block mt-4 bg-black text-white px-5 py-3 rounded-xl"
              >
                Create Listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((item) => (
                <Link
                  key={item.id}
                  href={`/listing/${item.id}`}
                  className="group rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* IMAGE */}
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-44 w-full object-contain rounded-xl bg-gray-100 mb-3"
                    />
                  ) : (
                    <div className="h-44 bg-gray-100 rounded-xl mb-3" />
                  )}

                  {/* CATEGORY */}
                  <span className="text-xs text-gray-500">
                    {item.category || "Other"}
                  </span>

                  {/* TITLE + PRICE */}
                  <div className="flex justify-between items-start mt-1">
                    <span className="font-semibold line-clamp-2">
                      {item.title}
                    </span>

                    <span className="font-bold">
                      ${(item.price_cents / 100).toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-400">
                    Tap to view
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