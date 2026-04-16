"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REPORT_REASONS = [
  "Inaccurate listing",
  "Scam or suspicious",
  "Prohibited item",
  "Spam",
  "Harassment",
  "Other",
];

type ListingImage = {
  id: string;
  image_url: string;
  sort_order: number;
};

function timeAgo(dateString?: string) {
  if (!dateString) return "";
  const now = new Date().getTime();
  const then = new Date(dateString).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just posted";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateString).toLocaleDateString();
}

export default function ListingPage() {
  const supabase = createClient();
  const params = useParams();
  const listingId = typeof params.id === "string" ? params.id : "";

  const [item, setItem] = useState<any | null>(undefined);
  const [images, setImages] = useState<ListingImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  useEffect(() => {
    async function load() {
      if (!listingId) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id ?? null);

      const { data: listingData, error: listingError } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .single();

      if (listingError || !listingData) {
        setItem(null);
        return;
      }

      setItem(listingData);

      const { data: imageData } = await supabase
        .from("listing_images")
        .select("*")
        .eq("listing_id", listingId)
        .order("sort_order", { ascending: true });

      const finalImages = imageData ?? [];
      setImages(finalImages);
      setSelectedImage(finalImages[0]?.image_url ?? listingData.image_url ?? null);

      if (user) {
        const { data: favoriteRow } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("listing_id", listingId)
          .maybeSingle();

        setIsFavorited(!!favoriteRow);
      } else {
        setIsFavorited(false);
      }

      const { count } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", listingId);

      setFavoriteCount(count ?? 0);
    }

    load();
  }, [listingId, supabase]);

  async function refreshFavoriteState() {
    if (!listingId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: favoriteRow } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();

      setIsFavorited(!!favoriteRow);
    } else {
      setIsFavorited(false);
    }

    const { count } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", listingId);

    setFavoriteCount(count ?? 0);
  }

  async function handleToggleFavorite() {
    if (!listingId) return;

    setFavoriteLoading(true);
    setFavoriteError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to save a listing.");
      }

      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("listing_id", listingId);

        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          listing_id: listingId,
        });

        if (error) throw new Error(error.message);
      }

      await refreshFavoriteState();
    } catch (err: any) {
      setFavoriteError(err.message || "Could not update favorites.");
    } finally {
      setFavoriteLoading(false);
    }
  }

  async function handleBuy() {
    if (!item?.id) return;

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ listingId: item.id }),
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    setReportError("");
    setReportSuccess("");
    setReportSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to report a listing.");
      }

      if (!reportReason) {
        throw new Error("Select a reason for the report.");
      }

      const { error } = await supabase.from("listing_reports").insert({
        listing_id: listingId,
        reporter_id: user.id,
        reason: reportReason,
        details: reportDetails.trim() || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      setReportSuccess("Report submitted. We’ll review it.");
      setReportReason("");
      setReportDetails("");
      setShowReportForm(false);
    } catch (err: any) {
      setReportError(err.message || "Could not submit report.");
    } finally {
      setReportSubmitting(false);
    }
  }

  if (item === undefined) {
    return <p className="p-6">Loading...</p>;
  }

  if (item === null) {
    return (
      <main className="min-h-screen -mx-6 -my-6 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold">Listing not found</h1>
          <p className="mt-2 text-gray-600">
            This listing may have been removed or is no longer available.
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-block rounded-xl border px-4 py-2 font-medium hover:bg-gray-50"
          >
            Back to Browse
          </Link>
        </div>
      </main>
    );
  }

  const otherPeopleCount =
    currentUserId && isFavorited
      ? Math.max(favoriteCount - 1, 0)
      : favoriteCount;

  const isOwnListing = currentUserId === item.seller_id;
  const isSold = item.status === "sold";
  const canBuy = !isOwnListing && !isSold;

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-xl">
          {selectedImage ? (
            <img
              src={selectedImage}
              className="h-96 w-full rounded-xl bg-gray-100 object-contain"
              alt={item.title}
            />
          ) : (
            <div className="h-96 w-full rounded-xl bg-gray-100" />
          )}

          {images.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`rounded-xl border p-1 ${
                    selectedImage === img.image_url
                      ? "border-black"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt="Listing thumbnail"
                    className="h-20 w-20 rounded-lg bg-gray-100 object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-xl">
          <div>
            <p className="text-sm text-gray-500">{item.category || "Other"}</p>

            <h1 className="mt-2 text-3xl font-bold">{item.title}</h1>

            <p className="mt-1 text-sm text-gray-400">
              Posted {timeAgo(item.created_at)}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Condition: {item.condition || "Not listed"}
            </p>

            <p className="mt-3 text-2xl font-bold">
              ${((item.price_cents ?? 0) / 100).toFixed(2)}
            </p>

            <p className="mt-4 text-gray-600">{item.description}</p>

            <div className="mt-6 rounded-2xl border bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleToggleFavorite}
                    disabled={favoriteLoading || isFavorited}
                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                      isFavorited
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white hover:bg-gray-100"
                    } disabled:opacity-50`}
                  >
                    {favoriteLoading
                      ? "Updating..."
                      : isFavorited
                      ? "Saved"
                      : "Save to Favorites"}
                  </button>

                  {isFavorited && (
                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      disabled={favoriteLoading}
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
                    >
                      {favoriteLoading ? "Updating..." : "Remove from Saved"}
                    </button>
                  )}
                </div>

                <span className="text-sm text-gray-500">
                  {otherPeopleCount === 0
                    ? "Be the first student to save this"
                    : otherPeopleCount === 1
                    ? "1 other student saved this"
                    : `${otherPeopleCount} other students saved this`}
                </span>
              </div>

              {favoriteError && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {favoriteError}
                </div>
              )}
            </div>

            <div className="mt-6">
              {!showReportForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowReportForm(true);
                    setReportError("");
                    setReportSuccess("");
                  }}
                  className="text-sm text-gray-600 underline hover:text-black"
                >
                  Report listing
                </button>
              ) : (
                <form
                  onSubmit={handleReport}
                  className="space-y-3 rounded-2xl border bg-gray-50 p-4"
                >
                  <div>
                    <label className="block text-sm font-medium">Reason</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="mt-1 w-full rounded-xl border px-4 py-3"
                      required
                    >
                      <option value="">Select a reason</option>
                      {REPORT_REASONS.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">
                      Details (optional)
                    </label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Add more detail if needed..."
                      className="mt-1 min-h-[100px] w-full rounded-xl border px-4 py-3"
                    />
                  </div>

                  {reportError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {reportError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={reportSubmitting}
                      className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      {reportSubmitting ? "Submitting..." : "Submit Report"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowReportForm(false);
                        setReportError("");
                      }}
                      className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {reportSuccess && (
                <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  {reportSuccess}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleBuy}
              disabled={!canBuy}
              className={`group relative w-full overflow-hidden rounded-xl py-3 font-medium text-white transition ${
                canBuy
                  ? "bg-black hover:shadow-lg"
                  : "cursor-not-allowed bg-gray-400"
              }`}
            >
              <span className="relative z-10">
                {isOwnListing
                  ? "Your Listing"
                  : isSold
                  ? "Already Swept Up"
                  : "Sweep It Up"}
              </span>

              {canBuy && (
                <>
                  <img
                    src="/broom.png"
                    alt="Broom sweep"
                    className="pointer-events-none absolute -left-24 top-1/2 z-20 h-12 -translate-y-1/2 rotate-[-8deg] opacity-0 transition-all duration-500 group-hover:left-[78%] group-hover:opacity-100"
                  />
                  <span className="pointer-events-none absolute inset-0">
                    <span className="absolute -left-1/2 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-500 group-hover:left-full group-hover:opacity-100" />
                  </span>
                </>
              )}
            </button>

            <Link
              href="/browse"
              className="block rounded-xl border py-3 text-center hover:shadow"
            >
              Back to browse
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}