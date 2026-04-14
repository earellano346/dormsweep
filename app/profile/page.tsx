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
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="bg-white p-6 rounded-3xl shadow-xl">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <section className="bg-white p-6 rounded-3xl shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Active Listings</h2>

          <div className="grid md:grid-cols-3 gap-4">
            {active?.map(item => (
              <Link key={item.id} href={`/listing/${item.id}`} className="border p-4 rounded-xl">
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Sold</h2>

          <div className="grid md:grid-cols-3 gap-4">
            {sold?.map(item => (
              <div key={item.id} className="border p-4 rounded-xl opacity-70">
                {item.title}
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}