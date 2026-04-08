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
    <main className="min-h-screen bg-gray-50 -mx-6 -my-6 p-6">
      <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border p-8">
        <h1 className="text-4xl font-bold">DormSweep</h1>
        <p className="text-gray-600 mt-2">
          Buy & sell dorm essentials with students on your campus.
        </p>

        <div className="flex gap-3 mt-6">
          <Link
            href="/browse"
            className="bg-black text-white px-5 py-3 rounded-xl font-medium"
          >
            Browse Items
          </Link>
          <Link
            href="/list"
            className="border px-5 py-3 rounded-xl font-medium"
          >
            List an Item
          </Link>
        </div>

        <h2 className="mt-10 text-xl font-semibold">Featured Listings</h2>

        {loading ? (
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {featured.map((item) => (
              <Link
                key={item.id}
                href={`/listing/${item.id}`}
                className="border rounded-xl p-4 bg-white"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-32 w-full object-contain rounded-lg mb-3 bg-gray-100"
                  />
                ) : (
                  <div className="h-32 bg-gray-100 rounded-lg mb-3" />
                )}

                <div className="flex justify-between">
                  <span className="font-semibold">{item.title}</span>
                  <span className="font-bold">
                    ${((item.price_cents ?? 0) / 100).toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}