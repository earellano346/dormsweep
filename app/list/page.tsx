"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
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

export default function ListPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const preview = useMemo(() => imageFile ? URL.createObjectURL(imageFile) : null, [imageFile]);

  async function handleSubmit(e:any){
    e.preventDefault();
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user?.id)
      .single();

    const filePath = `${user?.id}/${Date.now()}.jpg`;

    await supabase.storage.from("listings_images").upload(filePath, imageFile!);

    const { data: urlData } = supabase.storage
      .from("listings_images")
      .getPublicUrl(filePath);

    const { data: listing } = await supabase
      .from("listings")
      .insert({
        title,
        description,
        category,
        price_cents: Number(price)*100,
        image_url: urlData.publicUrl,
        seller_id: user?.id,
        school_id: profile?.school_id,
        status: "active",
      })
      .select("id")
      .single();

    router.push(`/listing/${listing.id}`);
  }

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-3xl shadow-xl space-y-5">

        <h1 className="text-2xl font-bold">Create Listing</h1>

        <input
          placeholder="Title"
          className="w-full border px-4 py-3 rounded-xl"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          className="w-full border px-4 py-3 rounded-xl"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
        />

        <select
          className="w-full border px-4 py-3 rounded-xl"
          value={category}
          onChange={(e)=>setCategory(e.target.value)}
        >
          <option>Select category</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <input
          type="number"
          placeholder="Price"
          className="w-full border px-4 py-3 rounded-xl"
          value={price}
          onChange={(e)=>setPrice(e.target.value)}
        />

        <input
          type="file"
          onChange={(e)=>setImageFile(e.target.files?.[0] ?? null)}
        />

        {preview && <img src={preview} className="h-60 object-contain"/>}

        <button
          onClick={handleSubmit}
          className="w-full bg-black text-white py-3 rounded-xl"
        >
          {submitting ? "Posting..." : "Post Listing"}
        </button>
      </div>
    </main>
  );
}