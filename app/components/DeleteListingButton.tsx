"use client";

import { useState } from "react";

export default function DeleteListingButton({
  listingId,
}: {
  listingId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleDelete() {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete listing.");
      }

      setSuccess("Listing deleted successfully.");
      setShowConfirm(false);

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setSuccess("");
          setShowConfirm(true);
        }}
        disabled={loading}
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete"}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">
              Delete listing?
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              This will remove the listing from DormSweep. This action can’t be
              undone.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 rounded-xl border px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-2 rounded-xl border border-green-200 bg-green-50 p-2 text-sm text-green-700">
          {success}
        </div>
      )}
    </>
  );
}