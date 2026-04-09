"use client";

export default function ConnectStripeButton() {
  async function handleConnect() {
    const res = await fetch("/api/stripe/connect", {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Something went wrong.");
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <button
      onClick={handleConnect}
      className="border px-4 py-2 rounded-xl font-medium"
    >
      Connect Payout Account
    </button>
  );
}