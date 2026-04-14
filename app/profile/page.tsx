import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteListingButton from "../components/DeleteListingButton";
import ConnectStripeButton from "../components/ConnectStripeButton";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  const { data: activeListings, error: activeError } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: soldListings, error: soldError } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .eq("status", "sold")
    .order("sold_at", { ascending: false });

  if (activeError) {
    console.error("Error loading active listings:", activeError.message);
  }

  if (soldError) {
    console.error("Error loading sold listings:", soldError.message);
  }

  const hasStripeAccount = !!profile?.stripe_account_id;

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Your Dashboard</h1>
              <p className="mt-1 text-gray-600">{user.email}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {hasStripeAccount ? (
                <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                  Payout account connected
                </p>
              ) : (
                <ConnectStripeButton />
              )}

              <form action="/auth/signout" method="post">
                <button className="rounded-xl border px-4 py-2 font-medium hover:bg-gray-50">
                  Log out
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Active Listings</h2>
            <p className="mt-1 text-sm text-gray-500">
              Items currently live on your campus marketplace.
            </p>
          </div>

          {!activeListings || activeListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="font-medium text-gray-700">No active listings.</p>
              <p className="mt-1 text-sm text-gray-500">
                Create a listing to start selling.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeListings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-white p-4 shadow-sm"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="mb-3 h-40 w-full rounded-xl bg-gray-100 object-contain"
                    />
                  ) : (
                    <div className="mb-3 h-40 rounded-xl bg-gray-100" />
                  )}

                  <p className="text-xs text-gray-500">{item.category || "Other"}</p>

                  <div className="mt-1 flex items-start justify-between gap-3">
                    <span className="font-semibold">{item.title}</span>
                    <span className="font-bold">
                      ${((item.price_cents ?? 0) / 100).toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/listing/${item.id}`}
                      className="flex-1 rounded-xl border px-3 py-2 text-center text-sm font-medium hover:bg-gray-50"
                    >
                      View
                    </Link>

                    <DeleteListingButton listingId={item.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Sold Items</h2>
            <p className="mt-1 text-sm text-gray-500">
              Listings that have already been purchased.
            </p>
          </div>

          {!soldListings || soldListings.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="font-medium text-gray-700">No sold items yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {soldListings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-white p-4 shadow-sm opacity-80"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="mb-3 h-40 w-full rounded-xl bg-gray-100 object-contain"
                    />
                  ) : (
                    <div className="mb-3 h-40 rounded-xl bg-gray-100" />
                  )}

                  <p className="text-xs text-gray-500">{item.category || "Other"}</p>

                  <div className="mt-1 flex items-start justify-between gap-3">
                    <span className="font-semibold">{item.title}</span>
                    <span className="font-bold">
                      ${((item.price_cents ?? 0) / 100).toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium text-green-600">Sold</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}