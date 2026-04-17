"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RemoveSavedButton({
  listingId,
}: {
  listingId: string;
}) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRemove() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in.");
      }

      const { error: deleteError } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Could not remove saved listing.");
      setLoading(false);
    }
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={handleRemove}
        disabled={loading}
        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 font-medium transition hover:bg-gray-100 disabled:opacity-50"
      >
        {loading ? "Removing..." : "Remove"}
      </button>

      {error && (
        <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}