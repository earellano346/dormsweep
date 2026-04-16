"use client";

import { useState } from "react";

export default function ReportActionButtons({
  reportId,
  listingId,
  currentStatus,
}: {
  reportId: string;
  listingId: string;
  currentStatus: string;
}) {
  const [loading, setLoading] = useState("");

  async function runAction(action: "reviewed" | "dismissed" | "remove_listing") {
    setLoading(action);

    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, listingId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Action failed");
      }

      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Could not update report.");
    } finally {
      setLoading("");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => runAction("reviewed")}
        disabled={loading !== "" || currentStatus === "reviewed"}
        className="rounded-xl border px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {loading === "reviewed" ? "Updating..." : "Mark Reviewed"}
      </button>

      <button
        type="button"
        onClick={() => runAction("dismissed")}
        disabled={loading !== "" || currentStatus === "dismissed"}
        className="rounded-xl border px-4 py-2 font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {loading === "dismissed" ? "Updating..." : "Dismiss"}
      </button>

      <button
        type="button"
        onClick={() => runAction("remove_listing")}
        disabled={loading !== ""}
        className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading === "remove_listing" ? "Removing..." : "Remove Listing"}
      </button>
    </>
  );
}