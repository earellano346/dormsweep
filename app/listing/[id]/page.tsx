"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ListingPage({ params }: { params: any }) {
  const supabase = createClient();

  const [item, setItem] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { id } = await params;

      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      setItem(data);
    }

    load();
  }, [params]);

  async function handleBuy() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ listingId: item.id }),
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  if (!item) return <p className="p-6">Loading...</p>;

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-xl">
          <img
            src={item.image_url}
            className="w-full h-96 object-contain bg-gray-100 rounded-xl"
            alt={item.title}
          />
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <p className="text-sm text-gray-500">{item.category || "Other"}</p>

            <h1 className="text-3xl font-bold mt-2">{item.title}</h1>

            <p className="text-sm text-gray-500 mt-1">
              Condition: {item.condition || "Not listed"}
            </p>

            <p className="text-2xl font-bold mt-3">
              ${((item.price_cents ?? 0) / 100).toFixed(2)}
            </p>

            <p className="mt-4 text-gray-600">
              {item.description}
            </p>
          </div>

          <div className="space-y-3 mt-6">
            <button
              onClick={handleBuy}
              className="w-full bg-black text-white py-3 rounded-xl font-medium hover:shadow-lg"
            >
              Buy Now
            </button>

            <Link
              href="/browse"
              className="block text-center border py-3 rounded-xl hover:shadow"
            >
              Back to browse
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}