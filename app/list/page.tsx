"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ListItem() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number>(25);
  const [category, setCategory] = useState("Bedding");
  const [condition, setCondition] = useState("Good");
  const [location, setLocation] = useState("Campus pickup");
  const [description, setDescription] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [posted, setPosted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (imageFiles.length === 0) {
      alert("Please add at least one picture.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      alert("Please sign in first.");
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.school_id) {
      setLoading(false);
      alert("Could not find your school.");
      return;
    }

    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        setLoading(false);
        alert(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    const primaryImageUrl = uploadedUrls[0] ?? null;

    const { data: insertedListing, error: insertListingError } = await supabase
      .from("listings")
      .insert([
        {
          seller_id: user.id,
          school_id: profile.school_id,
          title,
          description,
          price_cents: Number(price) * 100,
          category,
          condition,
          location,
          status: "active",
          image_url: primaryImageUrl,
        },
      ])
      .select("id")
      .single();

    if (insertListingError || !insertedListing) {
      setLoading(false);
      alert(insertListingError?.message ?? "Failed to create listing.");
      return;
    }

    const imageRows = uploadedUrls.map((url, index) => ({
      listing_id: insertedListing.id,
      image_url: url,
      sort_order: index,
    }));

    const { error: insertImagesError } = await supabase
      .from("listing_images")
      .insert(imageRows);

    setLoading(false);

    if (insertImagesError) {
      alert(insertImagesError.message);
      return;
    }

    setPosted(true);
    setTitle("");
    setPrice(25);
    setCategory("Bedding");
    setCondition("Good");
    setLocation("Campus pickup");
    setDescription("");
    setImageFiles([]);

    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gray-50 -mx-6 -my-6 p-6">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold">List an item</h1>

        <form
          onSubmit={submit}
          className="mt-4 border rounded-2xl bg-white p-6 shadow-sm"
        >
          <label className="block text-sm font-medium">Title</label>
          <input
            className="mt-1 w-full border rounded-xl px-4 py-3"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Price</label>
              <input
                className="mt-1 w-full border rounded-xl px-4 py-3"
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Category</label>
              <select
                className="mt-1 w-full border rounded-xl px-4 py-3 bg-white"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Bedding</option>
                <option>Appliances</option>
                <option>Lighting</option>
                <option>Storage</option>
                <option>Decor</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Condition</label>
              <select
                className="mt-1 w-full border rounded-xl px-4 py-3 bg-white"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option>Like New</option>
                <option>Good</option>
                <option>Fair</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Pickup location</label>
              <input
                className="mt-1 w-full border rounded-xl px-4 py-3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <label className="block text-sm font-medium mt-4">Description</label>
          <textarea
            className="mt-1 w-full border rounded-xl px-4 py-3"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="block text-sm font-medium mt-4">
            Listing pictures
          </label>
          <input
            className="mt-1 w-full border rounded-xl px-4 py-3 bg-white"
            type="file"
            accept="image/*"
            multiple
            required
            onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
          />

          {imageFiles.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {imageFiles.length} image{imageFiles.length > 1 ? "s" : ""} selected
            </p>
          )}

          <button
            disabled={loading}
            className="mt-6 bg-black text-white px-5 py-3 rounded-xl font-medium disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post listing"}
          </button>

          {posted && (
            <div className="mt-4 border rounded-xl bg-gray-50 p-4">
              <p className="font-semibold">Posted!</p>
              <p className="text-sm text-gray-600">
                Go to the homepage or your profile to see it.
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}