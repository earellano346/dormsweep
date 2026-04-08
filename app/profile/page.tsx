import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteListingButton from "@/app/components/DeleteListingButton";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (listingsError) {
    console.error("Error loading listings:", listingsError.message);
  }

  const myListings = listings ?? [];

  return (
    <main className="min-h-screen bg-gray-50 -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-4xl bg-white border rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-gray-600 text-sm mt-1">{user.email}</p>
          </div>

          <form action="/auth/signout" method="post">
            <button className="border px-4 py-2 rounded-xl font-medium">
              Log out
            </button>
          </form>
        </div>

        <h2 className="mt-8 text-xl font-semibold">My Listings</h2>

        {myListings.length === 0 ? (
          <p className="mt-3 text-gray-600 text-sm">
            You haven’t posted anything yet.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {myListings.map((item) => (
              <div key={item.id} className="border rounded-xl p-4">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold">{item.title}</p>

                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {item.description}
                      </p>
                    )}

                    <p className="text-sm text-gray-600 mt-1">
                      ${((item.price_cents ?? 0) / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/listing/${item.id}`}
                      className="border px-3 py-2 rounded-xl text-sm font-medium text-center"
                    >
                      View
                    </Link>

                    <DeleteListingButton listingId={item.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}