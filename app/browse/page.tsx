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

function timeAgo(dateString?: string) {
  if (!dateString) return "";
  const now = new Date().getTime();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "Just posted";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export default function BrowsePage() {
  const supabase = createClient();

  const [listings, setListings] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteLoadingId, setFavoriteLoadingId] = useState<string | null>(null);

  async function loadPage() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const { data: favorites } = await supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id);

    setFavoriteIds((favorites ?? []).map((row) => row.listing_id));
    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    let result = listings;

    if (selectedCategory !== "All") {
      result = result.filter((i) => i.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [selectedCategory, search, listings]);

  async function handleToggleFavorite(
    e: React.MouseEvent,
    listingId: string
  ) {
    e.preventDefault();
    e.stopPropagation();

    setFavoriteLoadingId(listingId);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const isSaved = favoriteIds.includes(listingId);

      if (isSaved) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

        if (error) throw error;

        setFavoriteIds((prev) => prev.filter((id) => id !== listingId));
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          listing_id: listingId,
        });

        if (error) throw error;

        setFavoriteIds((prev) => [...prev, listingId]);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
    } finally {
      setFavoriteLoadingId(null);
    }
  }

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border bg-white/80 p-6 shadow-xl backdrop-blur-md">
          <h1 className="text-3xl font-bold">Browse your campus</h1>

          <input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-4 w-full rounded-xl border px-4 py-3"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full border px-4 py-2 ${
                  selectedCategory === cat ? "bg-black text-white" : ""
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          {loading ? (
            <p>Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
              <p>No listings found</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {filtered.map((item) => {
                const isSaved = favoriteIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="relative rounded-2xl bg-white p-4 shadow-xl transition hover:-translate-y-1"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavorite(e, item.id)}
                      disabled={favoriteLoadingId === item.id}
                      className={`absolute right-3 top-3 z-10 rounded-full border px-3 py-1 text-xs font-medium shadow-sm ${
                        isSaved
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-gray-700"
                      } disabled:opacity-50`}
                    >
                      {favoriteLoadingId === item.id
                        ? "..."
                        : isSaved
                        ? "Saved"
                        : "♡ Save"}
                    </button>

                    <Link href={`/listing/${item.id}`} className="block">
                      <img
                        src={item.image_url}
                        className="mb-3 h-40 w-full rounded-xl bg-gray-100 object-contain"
                        alt={item.title}
                      />

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-500">{item.category}</p>
                        <p className="text-xs text-gray-400">
                          {timeAgo(item.created_at)}
                        </p>
                      </div>

                      <div className="mt-2 flex justify-between gap-3">
                        <span className="font-semibold">{item.title}</span>
                        <span className="font-bold">
                          ${(item.price_cents / 100).toFixed(2)}
                        </span>
                      </div>

                      {isSaved && (
                        <div className="mt-3 inline-flex rounded-full border border-black bg-black px-3 py-1 text-xs font-medium text-white">
                          Saved
                        </div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}