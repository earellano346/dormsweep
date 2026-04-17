"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import heic2any from "heic2any";

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

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Used"];

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function ListPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const previews = useMemo(() => {
    return imageFiles.map((file) => URL.createObjectURL(file));
  }, [imageFiles]);

  // 🔥 HEIC HANDLER
  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const processedFiles: File[] = [];

    for (const file of files) {
      if (
        file.type === "image/heic" ||
        file.name.toLowerCase().endsWith(".heic")
      ) {
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
          });

          const jpegFile = new File(
            [convertedBlob as Blob],
            file.name.replace(/\.heic$/i, ".jpg"),
            { type: "image/jpeg" }
          );

          processedFiles.push(jpegFile);
        } catch (err) {
          console.error("HEIC conversion failed:", err);
        }
      } else {
        processedFiles.push(file);
      }
    }

    setImageFiles(processedFiles);
  }

  const canSubmit =
    title &&
    description &&
    condition &&
    price &&
    category &&
    pickupLocation &&
    phoneNumber &&
    imageFiles.length > 0 &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSubmitting(false);
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (!profile?.school_id) {
        throw new Error("Missing school profile.");
      }

      const uploadedUrls: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExt = file.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("listings_images")
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data } = supabase.storage
          .from("listings_images")
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      }

      const { data: listing } = await supabase
        .from("listings")
        .insert({
          title,
          description,
          condition,
          category,
          price_cents: Math.round(Number(price) * 100),
          image_url: uploadedUrls[0],
          seller_id: user.id,
          school_id: profile.school_id,
          pickup_location: pickupLocation,
          phone_number: phoneNumber,
          status: "active",
        })
        .select("id")
        .single();

      if (!listing) throw new Error("Failed to create listing");

      await supabase.from("listing_images").insert(
        uploadedUrls.map((url, i) => ({
          listing_id: listing.id,
          image_url: url,
          sort_order: i,
        }))
      );

      router.push(`/listing/${listing.id}`);
    } catch (err: any) {
      setSubmitting(false);
      setErrorMessage(err.message);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Create Listing</h1>

        {errorMessage && (
          <div className="rounded-xl border bg-red-50 p-3 text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            placeholder="Title"
            className="w-full border p-3 rounded-xl"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Description"
            className="w-full border p-3 rounded-xl"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <select
            className="w-full border p-3 rounded-xl"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="">Condition</option>
            {CONDITIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            className="w-full border p-3 rounded-xl"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Category</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Price"
            className="w-full border p-3 rounded-xl"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <input
            placeholder="Pickup location"
            className="w-full border p-3 rounded-xl"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
          />

          <input
            placeholder="Phone number"
            className="w-full border p-3 rounded-xl"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
          />

          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/heic"
            multiple
            onChange={handleImageChange}
            className="w-full border p-3 rounded-xl"
          />

          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {previews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  className="h-40 w-full object-contain rounded-xl border"
                />
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-black text-white py-3 rounded-xl"
          >
            {submitting ? "Posting..." : "Post Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}