import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    redirect("/");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    redirect("/");
  }

  const buyerId = session.metadata?.buyer_id;
  const listingId = session.metadata?.listing_id;

  if (!buyerId || !listingId) {
    redirect("/");
  }

  if (buyerId !== user.id) {
    redirect("/");
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .select("id, title, price_cents, pickup_location, phone_number, status")
    .eq("id", listingId)
    .single();

  if (error || !listing) {
    redirect("/");
  }

  return (
    <main className="min-h-screen -mx-6 -my-6 bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <p className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              Payment successful
            </p>

            <h1 className="mt-4 text-3xl font-bold">Purchase complete</h1>

            <p className="mt-2 text-gray-600">
              You bought <span className="font-medium">{listing.title}</span> for{" "}
              <span className="font-medium">
                ${((listing.price_cents ?? 0) / 100).toFixed(2)}
              </span>
              .
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl space-y-5">
          <div>
            <h2 className="text-xl font-semibold">Pickup & Contact Info</h2>
            <p className="mt-1 text-sm text-gray-500">
              This information is only shown after the transaction is complete.
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Pickup location</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {listing.pickup_location || "Not provided"}
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-500">Phone number</p>
            <p className="mt-1 text-base font-semibold text-gray-900">
              {listing.phone_number || "Not provided"}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              Reach out to the seller to coordinate pickup. Meet in a safe,
              public spot on campus.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/browse"
            className="rounded-xl bg-black px-5 py-3 font-medium text-white"
          >
            Back to Browse
          </Link>

          <Link
            href="/profile"
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium text-gray-900"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    </main>
  );
}