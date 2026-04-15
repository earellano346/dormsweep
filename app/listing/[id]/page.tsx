"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

export default function ListingPage({ params }: { params: any }) {
  const supabase = createClient();

  const [item, setItem] = useState<any>(null);
  const [images, setImages] = useState<ListingImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSuccess, setReportSuccess] = useState("");

  useEffect(() => {
    async function load() {
      const { id } = await params;

      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      setItem(data);

      const { data: imageData } = await supabase
        .from("listing_images")
        .select("*")
        .eq("listing_id", id)
        .order("sort_order", { ascending: true });

      const finalImages = imageData ?? [];
      setImages(finalImages);
      setSelectedImage(finalImages[0]?.image_url ?? data?.image_url ?? null);
    }

    load();
  }, [params, supabase]);

  async function handleBuy() {
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
        listing_id: item.id,
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

  if (!item) return <p className="p-6">Loading...</p>;

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl shadow-xl">
          {selectedImage ? (
            <img
              src={selectedImage}
              className="w-full h-96 object-contain bg-gray-100 rounded-xl"
              alt={item.title}
            />
          ) : (
            <div className="w-full h-96 rounded-xl bg-gray-100" />
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

            <div className="mt-6">
              {!showReportForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowReportForm(true);
                    setReportError("");
                    setReportSuccess("");
                  }}
                  className="text-sm underline text-gray-600 hover:text-black"
                >
                  Report listing
                </button>
              ) : (
                <form onSubmit={handleReport} className="space-y-3 rounded-2xl border bg-gray-50 p-4">
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
                    <label className="block text-sm font-medium">Details (optional)</label>
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