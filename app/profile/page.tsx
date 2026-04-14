import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: active } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .eq("status", "active");

  const { data: sold } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .eq("status", "sold");

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="bg-white p-6 rounded-3xl shadow-xl">
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your listings and track your sales.
          </p>
        </div>

        {/* ACTIVE */}
        <section className="bg-white p-6 rounded-3xl shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Active Listings</h2>

          {!active?.length ? (
            <p className="text-gray-500">No active listings.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {active.map((item) => (
                <Link key={item.id} href={`/listing/${item.id}`} className="border rounded-2xl p-4 hover:shadow">
                  {item.image_url && (
                    <img src={item.image_url} className="h-40 w-full object-contain mb-2" />
                  )}
                  <div className="flex justify-between">
                    <span>{item.title}</span>
                    <span>${(item.price_cents/100).toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* SOLD */}
        <section className="bg-white p-6 rounded-3xl shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Sold Items</h2>

          {!sold?.length ? (
            <p className="text-gray-500">No sold items yet.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {sold.map((item) => (
                <div key={item.id} className="border rounded-2xl p-4 opacity-70">
                  {item.image_url && (
                    <img src={item.image_url} className="h-40 w-full object-contain mb-2" />
                  )}
                  <div className="flex justify-between">
                    <span>{item.title}</span>
                    <span>${(item.price_cents/100).toFixed(2)}</span>
                  </div>
                  <p className="text-green-600 text-sm mt-1">Sold</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}