"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  "Books","Clothes","Electronics","Furniture","Dorm Essentials",
  "School Supplies","Kitchen","Decor","Sports & Fitness","Other",
];

export default function ListPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const preview = useMemo(() => {
    return imageFile ? URL.createObjectURL(imageFile) : null;
  }, [imageFile]);

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
        pickup_location: pickupLocation,
        phone_number: phoneNumber,
        status: "active",
      })
      .select("id")
      .single();

    router.push(`/listing/${listing?.id}`);
  }

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="text-3xl font-bold">Create Listing</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <section className="rounded-3xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-semibold">Item Details</h2>

            <input className="w-full border px-4 py-3 rounded-xl" placeholder="Title"
              value={title} onChange={(e)=>setTitle(e.target.value)} />

            <textarea className="w-full border px-4 py-3 rounded-xl"
              value={description} onChange={(e)=>setDescription(e.target.value)} />

            <select className="w-full border px-4 py-3 rounded-xl"
              value={category} onChange={(e)=>setCategory(e.target.value)}>
              <option>Select category</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>

            <input type="number" className="w-full border px-4 py-3 rounded-xl"
              value={price} onChange={(e)=>setPrice(e.target.value)} />

            <input type="file" onChange={(e)=>setImageFile(e.target.files?.[0] ?? null)} />

            {preview && <img src={preview} className="h-60 object-contain" />}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-xl space-y-4">
            <h2 className="text-xl font-semibold">Pickup & Contact</h2>

            <input className="w-full border px-4 py-3 rounded-xl"
              placeholder="Pickup location"
              value={pickupLocation} onChange={(e)=>setPickupLocation(e.target.value)} />

            <input className="w-full border px-4 py-3 rounded-xl"
              placeholder="Phone number"
              value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} />
          </section>

          <button className="w-full bg-black text-white py-3 rounded-xl">
            {submitting ? "Posting..." : "Post Listing"}
          </button>

        </form>
      </div>
    </main>
  );
}