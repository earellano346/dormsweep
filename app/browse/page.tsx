"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BrowsePage() {
  const supabase = createClient();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setListings([]);
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
        setListings([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .eq("school_id", profile.school_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error.message);
        setListings([]);
      } else {
        setListings(data ?? []);
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 -mx-6 -my-6 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold">Browse Items</h1>

        {loading ? (
          <p className="mt-6 text-sm text-gray-600">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {listings.map((item) => (
              <Link
                key={item.id}
                href={`/listing/${item.id}`}
                className="border rounded-xl p-4 bg-white"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-40 w-full object-contain rounded-lg mb-3 bg-gray-100"
                  />
                ) : (
                  <div className="h-40 bg-gray-100 rounded-lg mb-3" />
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