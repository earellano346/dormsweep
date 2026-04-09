"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  image_url: string | null;
  category: string | null;
  condition: string | null;
  location: string | null;
  status: string | null;
  school_id: string;
};

type ListingImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

export default function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();

  const [item, setItem] = useState<Listing | null>(null);
  const [images, setImages] = useState<ListingImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const { id } = await params;

      const { data: listingData } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (!listingData) {
        setLoading(false);
        return;
      }

      const { data: imageData } = await supabase
        .from("listing_images")
        .select("*")
        .eq("listing_id", id)
        .order("sort_order", { ascending: true });

      const finalImages = imageData ?? [];

      setItem(listingData);
      setImages(finalImages);
      setSelectedImage(
        finalImages[0]?.image_url ?? listingData.image_url ?? null
      );
      setLoading(false);
    }

    loadData();
  }, [params]);

  async function handleBuy(listingId: string) {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ listingId }),
    });

    const data = await res.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "Checkout failed");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 -mx-6 -my-6 p-6">
        <div className="max-w-4xl mx-auto bg-white border rounded-2xl p-6">
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-gray-50 -mx-6 -my-6 p-6">
        <div className="max-w-4xl mx-auto bg-white border rounded-2xl p-6">
          <h1 className="text-2xl font-bold">Listing not found</h1>
          <Link
            href="/browse"
            className="inline-block mt-6 border px-4 py-2 rounded-xl"
          >
            Back
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 -mx-6 -my-6 p-6">
      <div className="max-w-4xl mx-auto bg-white border rounded-2xl p-6">
        {/* MAIN IMAGE */}
        {selectedImage ? (
          <img
            src={selectedImage}
            alt={item.title}
            className="w-full h-80 object-contain rounded-xl mb-4 bg-gray-100"
          />
        ) : (
          <div className="w-full h-80 bg-gray-100 rounded-xl mb-4" />
        )}

        {/* THUMBNAILS */}
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto mb-6">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img.image_url)}
                className={`border rounded-lg p-1 ${
                  selectedImage === img.image_url
                    ? "border-black"
                    : "border-gray-300"
                }`}
              >
                <img
                  src={img.image_url}
                  alt="Listing thumbnail"
                  className="h-20 w-20 object-contain rounded bg-gray-100"
                />
              </button>
            ))}
          </div>
        )}

        {/* TITLE + PRICE */}
        <div className="flex justify-between">
          <h1 className="text-2xl font-bold">{item.title}</h1>
          <span className="text-xl font-bold">
            ${((item.price_cents ?? 0) / 100).toFixed(2)}
          </span>
        </div>

        {/* DETAILS */}
        <p className="mt-2 text-gray-600">
          {item.category ?? "Uncategorized"}
          {item.condition ? ` • ${item.condition}` : ""}
        </p>

        {item.location && (
          <p className="mt-2 text-sm text-gray-600">
            Pickup: {item.location}
          </p>
        )}

        {item.description && (
          <p className="mt-4 text-gray-700">{item.description}</p>
        )}

        {/* 🔥 BUY BUTTON */}
        <button
          onClick={() => handleBuy(item.id)}
          className="bg-black text-white px-4 py-3 rounded-xl mt-6 w-full font-medium"
        >
          Buy Now
        </button>

        {/* BACK */}
        <Link
          href="/browse"
          className="inline-block mt-4 border px-4 py-2 rounded-xl"
        >
          Back
        </Link>
      </div>
    </main>
  );
}