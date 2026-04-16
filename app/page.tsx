import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import WhyDormSweep from "@/app/components/WhyDormSweep";

type Listing = {
  id: string;
  title: string;
  description: string | null;
  price_cents: number | null;
  image_url: string | null;
  status: string | null;
  school_id: string;
  category?: string | null;
};

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let soldStats: Record<string, number> = {};

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (profile?.school_id) {
      const { data: sold } = await supabase
        .from("listings")
        .select("category")
        .eq("status", "sold")
        .eq("school_id", profile.school_id);

      if (sold) {
        soldStats = sold.reduce((acc: Record<string, number>, item: any) => {
          const category = item.category || "Other";
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});
      }
    }
  }

  const sortedSoldStats = Object.entries(soldStats).sort((a, b) => b[1] - a[1]);
  const topCategory = sortedSoldStats[0] ?? null;
  const remainingCategories = sortedSoldStats.slice(1);

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-md">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
              Student marketplace • campus-only access
            </p>

            <h1 className="mt-5 bg-gradient-to-r from-black via-gray-800 to-gray-500 bg-clip-text text-4xl font-bold leading-tight text-transparent md:text-5xl">
              Buy, sell, and sweep up dorm essentials on your campus.
            </h1>

            <p className="mt-4 max-w-2xl text-base text-gray-600 md:text-lg">
              DormSweep helps students buy and sell with other students at their
              own school using verified student email access.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {!user ? (
                <Link
                  href="/login"
                  className="rounded-xl bg-black px-5 py-3 font-medium text-white transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Log in with your student email
                </Link>
              ) : (
                <>
                  <Link
                    href="/browse"
                    className="rounded-xl bg-black px-5 py-3 font-medium text-white transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Browse Listings
                  </Link>

                  <Link
                    href="/list"
                    className="rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium text-gray-900 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    Sell Item
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {!user && <WhyDormSweep />}

        {user && (
          <>
            {sortedSoldStats.length > 0 && (
              <section className="rounded-3xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-md">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">🔥 Popular on your campus</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Based on what students have bought the most.
                  </p>
                </div>

                {topCategory && (
                  <div className="mb-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Most Popular Category
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900">
                      {topCategory[0]}
                    </h3>
                    <p className="mt-2 text-base text-gray-600">
                      {topCategory[1]} sold
                    </p>
                  </div>
                )}

                {remainingCategories.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {remainingCategories.map(([category, count]) => (
                      <div
                        key={category}
                        className="rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm"
                      >
                        <p className="text-sm text-gray-500">{category}</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                          {count} sold
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <WhyDormSweep />
          </>
        )}
      </div>
    </main>
  );
}