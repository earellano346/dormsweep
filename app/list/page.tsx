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

const CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Fair",
  "Used",
];

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const preview = useMemo(() => {
    return imageFile ? URL.createObjectURL(imageFile) : null;
  }, [imageFile]);

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    condition.trim().length > 0 &&
    price.trim().length > 0 &&
    Number(price) > 0 &&
    category.trim().length > 0 &&
    pickupLocation.trim().length > 0 &&
    phoneNumber.replace(/\D/g, "").length === 10 &&
    !!imageFile &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!canSubmit) {
      setErrorMessage(
        "Fill out every field, including condition, pickup location, phone number, price, and picture."
      );
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setSubmitting(false);
        setErrorMessage("You need to log in first.");
        router.push("/login?next=/list");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.school_id) {
        throw new Error("Could not find your school profile.");
      }

      if (phoneNumber.replace(/\D/g, "").length !== 10) {
        throw new Error("Enter a valid 10-digit phone number.");
      }

      if (!imageFile) {
        throw new Error("Please upload an image.");
      }

      const fileExt = imageFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("listings_images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: urlData } = supabase.storage
        .from("listings_images")
        .getPublicUrl(filePath);

      const imageUrl = urlData.publicUrl;

      const { data: listing, error: insertError } = await supabase
        .from("listings")
        .insert({
          title: title.trim(),
          description: description.trim(),
          condition: condition.trim(),
          category: category.trim(),
          price_cents: Math.round(Number(price) * 100),
          image_url: imageUrl,
          seller_id: user.id,
          school_id: profile.school_id,
          pickup_location: pickupLocation.trim(),
          phone_number: phoneNumber.trim(),
          status: "active",
        })
        .select("id")
        .single();

      if (insertError || !listing) {
        throw new Error(insertError?.message || "Could not create listing.");
      }

      router.push(`/listing/${listing.id}`);
      router.refresh();
    } catch (err: any) {
      setSubmitting(false);
      setErrorMessage(err.message || "Could not create listing.");
    }
  }

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="text-3xl font-bold">Create Listing</h1>
          <p className="mt-1 text-gray-600">
            Post your item for students at your school.
          </p>
        </section>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl bg-white p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Item Details</h2>
              <p className="mt-1 text-sm text-gray-500">
                Add the main info about what you’re selling.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                placeholder="Ex: Mini fridge"
                className="mt-1 w-full rounded-xl border px-4 py-3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                placeholder="Describe the item, condition, and anything the buyer should know..."
                className="mt-1 min-h-[140px] w-full rounded-xl border px-4 py-3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Condition</label>
              <select
                className="mt-1 w-full rounded-xl border px-4 py-3"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                required
              >
                <option value="">Select condition</option>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Category</label>
              <select
                className="mt-1 w-full rounded-xl border px-4 py-3"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Price ($)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="25.00"
                className="mt-1 w-full rounded-xl border px-4 py-3"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">
                Item Picture <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 w-full rounded-xl border px-4 py-3"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                A picture is required before posting.
              </p>
            </div>

            {preview && (
              <div className="rounded-2xl border bg-gray-50 p-4">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-60 w-full object-contain rounded-xl"
                />
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Pickup & Contact</h2>
              <p className="mt-1 text-sm text-gray-500">
                This info is only shown to the buyer after the transaction is complete.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium">
                Pickup location on campus
              </label>
              <input
                type="text"
                placeholder="Ex: Library entrance, Shen lobby, dorm lounge..."
                className="mt-1 w-full rounded-xl border px-4 py-3"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Phone number</label>
              <input
                type="tel"
                placeholder="(555) 555-5555"
                className="mt-1 w-full rounded-xl border px-4 py-3"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                required
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}