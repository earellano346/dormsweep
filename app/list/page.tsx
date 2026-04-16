"use client";

import { useEffect, useMemo, useState } from "react";
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

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Used"];

const PRICE_GUIDANCE: Record<
  string,
  {
    min: number;
    max: number;
    examples: string;
    tip: string;
  }
> = {
  Books: {
    min: 8,
    max: 45,
    examples: "Textbooks, novels, class books",
    tip: "Most student books move faster when priced clearly below buying new.",
  },
  Clothes: {
    min: 5,
    max: 35,
    examples: "Hoodies, jackets, jeans, shoes",
    tip: "Affordable everyday pieces usually perform better than trying to price near retail.",
  },
  Electronics: {
    min: 20,
    max: 180,
    examples: "Headphones, speakers, calculators, small tech",
    tip: "Electronics can go higher if they’re newer, but students still expect a strong discount.",
  },
  Furniture: {
    min: 20,
    max: 140,
    examples: "Chairs, shelves, small desks, storage",
    tip: "Furniture sells best when it feels cheaper than hauling something home or buying new.",
  },
  "Dorm Essentials": {
    min: 8,
    max: 60,
    examples: "Bedding, lamps, organizers, fans",
    tip: "These are usually impulse buys, so fair pricing matters a lot.",
  },
  "School Supplies": {
    min: 3,
    max: 25,
    examples: "Binders, notebooks, calculators, supplies",
    tip: "This category should usually stay inexpensive and easy to justify.",
  },
  Kitchen: {
    min: 8,
    max: 70,
    examples: "Microwaves, mini appliances, cookware",
    tip: "Kitchen items can sell fast when they clearly beat store prices.",
  },
  Decor: {
    min: 5,
    max: 40,
    examples: "Rugs, posters, lights, room decor",
    tip: "Decor tends to move best when it feels fun and cheap, not premium.",
  },
  "Sports & Fitness": {
    min: 10,
    max: 90,
    examples: "Balls, weights, bands, workout gear",
    tip: "This category has range, but fair used pricing helps a lot.",
  },
  Other: {
    min: 5,
    max: 50,
    examples: "General campus-use items",
    tip: "Try pricing this based on what a student would realistically want to pay today.",
  },
};

const CONDITION_ADVICE: Record<string, string> = {
  New: "New items can sit near the top of the range if they’re genuinely unused.",
  "Like New":
    "Like New items usually do well a little below the top of the range.",
  Good: "Good condition items usually fit comfortably in the middle of the range.",
  Fair: "Fair condition items usually need a lower price to move quickly.",
  Used: "Used items usually sell best when priced clearly below newer alternatives.",
};

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatDollars(amount: number) {
  return `$${amount.toFixed(2)}`;
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

  const [loadingStripeStatus, setLoadingStripeStatus] = useState(true);
  const [stripeConnected, setStripeConnected] = useState(false);

  const previews = useMemo(() => {
    return imageFiles.map((file) => URL.createObjectURL(file));
  }, [imageFiles]);

  const numericPrice = Number(price);
  const selectedGuidance = category ? PRICE_GUIDANCE[category] : null;

  const pricingFeedback = useMemo(() => {
    if (!selectedGuidance || !price.trim() || Number.isNaN(numericPrice) || numericPrice <= 0) {
      return null;
    }

    const { min, max } = selectedGuidance;

    if (category === "Books" && numericPrice > 60) {
      if (numericPrice > max * 1.8) {
        return {
          tone: "medium" as const,
          title: "This is much higher than most student book listings",
          message:
            "Some textbooks can be expensive depending on the course, edition, or access code. Make sure your price clearly reflects the book’s real value and condition.",
        };
      }

      return {
        tone: "medium" as const,
        title: "This is higher than a typical book listing",
        message:
          "That can still make sense for certain textbooks. Make sure your price reflects the course, edition, and condition so buyers understand why it’s higher.",
      };
    }

    if (numericPrice > max * 1.4) {
      return {
        tone: "high" as const,
        title: "This price is much higher than typical student listings",
        message:
          "You can still post it, but make sure the price clearly reflects the item’s real value, condition, or original cost.",
      };
    }

    if (numericPrice > max) {
      return {
        tone: "medium" as const,
        title: "This price is above the usual range",
        message:
          "That can still be okay if the item is in strong condition, but pricing closer to the suggested range may help it sell faster.",
      };
    }

    if (numericPrice < min * 0.75) {
      return {
        tone: "value" as const,
        title: "This looks like a strong value price",
        message:
          "Listings priced this well can get attention quickly, especially for everyday dorm items.",
      };
    }

    if (numericPrice < min) {
      return {
        tone: "good" as const,
        title: "This price is below the usual range",
        message:
          "That can help your item stand out if you want a faster sale.",
      };
    }

    return {
      tone: "good" as const,
      title: "This price fits the recommended range",
      message:
        "That should feel reasonable to students if the condition and photos match the listing.",
    };
  }, [selectedGuidance, price, numericPrice, category]);

  useEffect(() => {
    let mounted = true;

    async function loadStripeStatus() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!mounted) return;
          setStripeConnected(false);
          setLoadingStripeStatus(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("stripe_account_id")
          .eq("id", user.id)
          .single();

        if (!mounted) return;

        if (profileError) {
          setStripeConnected(false);
        } else {
          setStripeConnected(Boolean(profile?.stripe_account_id));
        }

        setLoadingStripeStatus(false);
      } catch {
        if (!mounted) return;
        setStripeConnected(false);
        setLoadingStripeStatus(false);
      }
    }

    loadStripeStatus();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    condition.trim().length > 0 &&
    price.trim().length > 0 &&
    Number(price) > 0 &&
    category.trim().length > 0 &&
    pickupLocation.trim().length > 0 &&
    phoneNumber.replace(/\D/g, "").length === 10 &&
    imageFiles.length > 0 &&
    stripeConnected &&
    !loadingStripeStatus &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (loadingStripeStatus) {
      setErrorMessage("Checking your Stripe account status. Try again in a second.");
      return;
    }

    if (!stripeConnected) {
      setErrorMessage(
        "You must connect your Stripe account before creating a listing."
      );
      return;
    }

    if (
      !title.trim() ||
      !description.trim() ||
      !condition.trim() ||
      !price.trim() ||
      Number(price) <= 0 ||
      !category.trim() ||
      !pickupLocation.trim() ||
      phoneNumber.replace(/\D/g, "").length !== 10 ||
      imageFiles.length === 0
    ) {
      setErrorMessage(
        "Fill out every field, including condition, pickup location, phone number, price, and at least one picture."
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
        .select("school_id, stripe_account_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.school_id) {
        throw new Error("Could not find your school profile.");
      }

      if (!profile.stripe_account_id) {
        throw new Error(
          "You must connect your Stripe account before creating a listing."
        );
      }

      if (phoneNumber.replace(/\D/g, "").length !== 10) {
        throw new Error("Enter a valid 10-digit phone number.");
      }

      if (imageFiles.length === 0) {
        throw new Error("Please upload at least one image.");
      }

      const uploadedUrls: string[] = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExt = file.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("listings_images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from("listings_images")
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      const coverImageUrl = uploadedUrls[0];

      const { data: listing, error: insertError } = await supabase
        .from("listings")
        .insert({
          title: title.trim(),
          description: description.trim(),
          condition: condition.trim(),
          category: category.trim(),
          price_cents: Math.round(Number(price) * 100),
          image_url: coverImageUrl,
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

      const imageRows = uploadedUrls.map((url, index) => ({
        listing_id: listing.id,
        image_url: url,
        sort_order: index,
      }));

      const { error: imagesInsertError } = await supabase
        .from("listing_images")
        .insert(imageRows);

      if (imagesInsertError) {
        throw new Error(imagesInsertError.message);
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
              {condition && (
                <p className="mt-2 text-xs text-gray-500">
                  {CONDITION_ADVICE[condition]}
                </p>
              )}
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

            {selectedGuidance && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-900">
                  Suggested price range for {category}
                </p>
                <p className="mt-1 text-sm text-blue-800">
                  {formatDollars(selectedGuidance.min)} to{" "}
                  {formatDollars(selectedGuidance.max)}
                </p>
                <p className="mt-2 text-sm text-blue-800">
                  <span className="font-medium">Common items:</span>{" "}
                  {selectedGuidance.examples}
                </p>
                <p className="mt-2 text-sm text-blue-800">
                  {selectedGuidance.tip}
                </p>
              </div>
            )}

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

            {pricingFeedback && (
              <div
                className={`rounded-2xl p-4 ${
                  pricingFeedback.tone === "high"
                    ? "border border-red-200 bg-red-50"
                    : pricingFeedback.tone === "medium"
                    ? "border border-amber-200 bg-amber-50"
                    : pricingFeedback.tone === "value"
                    ? "border border-green-200 bg-green-50"
                    : "border border-emerald-200 bg-emerald-50"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    pricingFeedback.tone === "high"
                      ? "text-red-800"
                      : pricingFeedback.tone === "medium"
                      ? "text-amber-900"
                      : pricingFeedback.tone === "value"
                      ? "text-green-800"
                      : "text-emerald-800"
                  }`}
                >
                  {pricingFeedback.title}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    pricingFeedback.tone === "high"
                      ? "text-red-700"
                      : pricingFeedback.tone === "medium"
                      ? "text-amber-800"
                      : pricingFeedback.tone === "value"
                      ? "text-green-700"
                      : "text-emerald-700"
                  }`}
                >
                  {pricingFeedback.message}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium">
                Pictures <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="mt-1 w-full rounded-xl border px-4 py-3"
                onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                You can upload multiple pictures. The first one will be the cover
                image.
              </p>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previews.map((src, index) => (
                  <div key={index} className="rounded-2xl border bg-gray-50 p-3">
                    <img
                      src={src}
                      alt={`Preview ${index + 1}`}
                      className="h-40 w-full rounded-xl object-contain"
                    />
                    {index === 0 && (
                      <p className="mt-2 text-center text-xs font-medium text-gray-600">
                        Cover image
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Pickup & Contact</h2>
              <p className="mt-1 text-sm text-gray-500">
                This info is only shown to the buyer after the transaction is
                complete.
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

          <section className="rounded-3xl bg-white p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Stripe Account</h2>
              <p className="mt-1 text-sm text-gray-500">
                You must connect Stripe before creating a listing so DormSweep can
                send your payout when an item sells.
              </p>
            </div>

            {loadingStripeStatus ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  Checking your Stripe account status...
                </p>
              </div>
            ) : stripeConnected ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">
                  Stripe account linked
                </p>
                <p className="mt-1 text-sm text-green-700">
                  You’re ready to create listings and receive payouts when items
                  sell.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-900">
                  Stripe account not linked
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  You must connect your Stripe account before creating a listing.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/profile")}
                  className="mt-4 rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Connect Stripe
                </button>
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Posting..."
              : !loadingStripeStatus && !stripeConnected
              ? "Connect Stripe to Post Listing"
              : "Post Listing"}
          </button>
        </form>
      </div>
    </main>
  );
}