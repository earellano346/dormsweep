import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ACTIVE LISTINGS
  const { data: activeListings } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // SOLD LISTINGS
  const { data: soldListings } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .eq("status", "sold")
    .order("sold_at", { ascending: false });

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <h1 className="text-3xl font-bold">Your Listings</h1>

        {/* ACTIVE */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Active Listings</h2>

          {!activeListings || activeListings.length === 0 ? (
            <p className="text-gray-500">No active listings.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeListings.map((item) => (
                <Link
                  key={item.id}
                  href={`/listing/${item.id}`}
                  className="rounded-2xl border p-4 shadow-sm hover:shadow-md"
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      className="h-40 w-full object-contain mb-3 rounded-xl"
                    />
                  )}
                  <div className="flex justify-between">
                    <span className="font-semibold">{item.title}</span>
                    <span className="font-bold">
                      ${(item.price_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* SOLD */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Sold</h2>

          {!soldListings || soldListings.length === 0 ? (
            <p className="text-gray-500">No sold items yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {soldListings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border p-4 shadow-sm opacity-70"
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      className="h-40 w-full object-contain mb-3 rounded-xl"
                    />
                  )}

                  <div className="flex justify-between">
                    <span className="font-semibold">{item.title}</span>
                    <span className="font-bold">
                      ${(item.price_cents / 100).toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-green-600 font-medium">
                    Sold
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}