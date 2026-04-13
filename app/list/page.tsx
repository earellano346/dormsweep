import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// keep your existing imports/components below this line

export default async function ListPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50 -mx-6 -my-6 p-6">
      {/* keep your current list page UI here */}
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Create Listing</h1>
        <p className="mt-2 text-sm text-gray-600">
          Post an item for students at your school.
        </p>

        {/* paste the rest of your existing form/content here */}
      </div>
    </main>
  );
}