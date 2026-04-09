"use client";

import { useState } from "react";

export default function ConnectStripeButton() {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    try {
      setLoading(true);

      const res = await fetch("/api/stripe/connect", {
        method: "POST",
      });

      const text = await res.text();

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Unknown server response");
      }

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      if (!data.url) {
        throw new Error("No onboarding URL was returned.");
      }

      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || "Failed to connect payout account.");
      console.error("Stripe connect error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={loading}
      className="border px-4 py-2 rounded-xl font-medium disabled:opacity-50"
    >
      {loading ? "Connecting..." : "Connect Payout Account"}
    </button>
  );
}