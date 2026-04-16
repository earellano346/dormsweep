"use client";

import { useState } from "react";

export default function DeleteListingButton({
  listingId,
}: {
  listingId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleDelete() {
    setError("");
    setSuccess("");

    const confirmed = confirm("Are you sure you want to delete this listing?");
    if (!confirmed) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete listing");
      }

      setSuccess("Listing deleted successfully");

      // refresh page after short delay
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-2 text-sm text-green-700">
          {success}
        </div>
      )}
    </div>
  );
}