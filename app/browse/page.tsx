"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "All","Books","Clothes","Electronics","Furniture","Dorm Essentials",
  "School Supplies","Kitchen","Decor","Sports & Fitness","Other",
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
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .eq("school_id", profile?.school_id)
        .order("created_at", { ascending: false });

      const items = data ?? [];
      setListings(items);
      setFiltered(items);
      setLoading(false);
    }

    load();
  }, []);

  useEffect(() => {
    let result = listings;

    if (selectedCategory !== "All") {
      result = result.filter(i => i.category === selectedCategory);
    }

    if (search.trim()) {
      result = result.filter(i =>
        i.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFiltered(result);
  }, [selectedCategory, search, listings]);

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* HEADER CARD */}
        <section className="rounded-3xl border bg-white/80 p-6 shadow-xl backdrop-blur-md">
          <h1 className="text-3xl font-bold">Browse your campus</h1>

          <input
            placeholder="Search items..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="mt-4 w-full rounded-xl border px-4 py-3"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={()=>setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full border ${
                  selectedCategory === cat ? "bg-black text-white" : ""
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* LISTINGS */}
        <section className="space-y-4">

          {loading ? (
            <p>Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 shadow-xl text-center">
              <p>No listings found</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {filtered.map(item => (
                <Link
                  key={item.id}
                  href={`/listing/${item.id}`}
                  className="rounded-2xl bg-white p-4 shadow-xl hover:-translate-y-1 transition"
                >
                  <img
                    src={item.image_url}
                    className="h-40 w-full object-contain bg-gray-100 rounded-xl mb-2"
                  />

                  <p className="text-xs text-gray-500">{item.category}</p>

                  <div className="flex justify-between">
                    <span>{item.title}</span>
                    <span>${(item.price_cents/100).toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}