import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteListingButton from "../components/DeleteListingButton";
import ConnectStripeButton from "../components/ConnectStripeButton";

function timeAgo(dateString?: string) {
  if (!dateString) return "";
  const now = new Date().getTime();
  const then = new Date(dateString).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateString).toLocaleDateString();
}

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

  const { data: activeListings } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: soldListings } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .eq("status", "sold")
    .order("sold_at", { ascending: false });

  const { data: favoriteRows } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", user.id);

  const favoriteIds = (favoriteRows ?? []).map((row) => row.listing_id);

  let favoriteListings: any[] = [];

  if (favoriteIds.length > 0) {
    const { data: favoritesListingsData } = await supabase
      .from("listings")
      .select("*")
      .in("id", favoriteIds)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    favoriteListings = favoritesListingsData ?? [];
  }

  const hasStripeAccount = !!profile?.stripe_account_id;

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* HEADER */}
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

        {/* SAVED LISTINGS */}
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Saved Listings</h2>

          {favoriteListings.length === 0 ? (
            <p>No saved listings yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {favoriteListings.map((item) => (
                <Link
                  key={item.id}
                  href={`/listing/${item.id}`}
                  className="rounded-2xl border p-4"
                >
                  <img
                    src={item.image_url}
                    className="mb-3 h-40 w-full object-contain"
                  />

                  <p className="text-xs text-gray-500">{item.category}</p>

                  <p className="text-xs text-gray-400">
                    {timeAgo(item.created_at)}
                  </p>

                  <div className="flex justify-between mt-1">
                    <span>{item.title}</span>
                    <span>
                      ${(item.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ACTIVE LISTINGS */}
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Active Listings</h2>

          {activeListings?.length === 0 ? (
            <p>No active listings.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeListings?.map((item) => (
                <div key={item.id} className="rounded-2xl border p-4">
                  <img
                    src={item.image_url}
                    className="mb-3 h-40 w-full object-contain"
                  />

                  <p className="text-xs text-gray-500">{item.category}</p>

                  <p className="text-xs text-gray-400">
                    {timeAgo(item.created_at)}
                  </p>

                  <div className="flex justify-between mt-1">
                    <span>{item.title}</span>
                    <span>
                      ${(item.price_cents / 100).toFixed(2)}
                    </span>
                  </div>

                  {/* 🔥 FIXED BUTTONS */}
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/listing/${item.id}`}
                      className="flex-1 rounded-xl border px-3 py-2 text-center font-medium hover:bg-gray-100 transition"
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

        {/* SOLD LISTINGS */}
        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Sold Listings</h2>

          {soldListings?.length === 0 ? (
            <p>No sold items yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {soldListings?.map((item) => (
                <div key={item.id} className="rounded-2xl border p-4 opacity-80">
                  <img
                    src={item.image_url}
                    className="mb-3 h-40 w-full object-contain"
                  />

                  <p className="text-xs text-gray-500">{item.category}</p>

                  <p className="text-xs text-gray-400">
                    Sold {timeAgo(item.sold_at)}
                  </p>

                  <div className="flex justify-between mt-1">
                    <span>{item.title}</span>
                    <span>
                      ${(item.price_cents / 100).toFixed(2)}
                    </span>
                  </div>

                  <p className="text-green-600 mt-2">Sold</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}