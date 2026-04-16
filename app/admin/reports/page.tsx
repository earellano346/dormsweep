import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import ReportActionButtons from "@/app/components/ReportActionButtons";

function isAllowedAdmin(email?: string | null) {
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return !!email && allowed.includes(email.toLowerCase());
}

export default async function AdminReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedAdmin(user.email)) {
    redirect("/");
  }

  const { data: reports, error } = await adminSupabase
    .from("listing_reports")
    .select(`
      id,
      reason,
      details,
      status,
      created_at,
      listing_id,
      reporter_id,
      listings (
        id,
        title,
        status
      ),
      profiles (
        id,
        email
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen -mx-6 -my-6 p-6">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-3xl font-bold">Admin Reports</h1>
          <p className="mt-4 text-red-600">Failed to load reports: {error.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-3xl font-bold">Admin Reports</h1>
          <p className="mt-2 text-gray-600">
            Review listing reports and take moderation actions.
          </p>
        </section>

        {!reports || reports.length === 0 ? (
          <section className="rounded-3xl bg-white p-8 shadow-xl">
            <p className="text-gray-600">No reports yet.</p>
          </section>
        ) : (
          <div className="space-y-4">
            {reports.map((report: any) => (
              <section
                key={report.id}
                className="rounded-3xl bg-white p-6 shadow-xl"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">
                      {report.listings?.title || "Unknown listing"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Listing status: {report.listings?.status || "unknown"}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Reporter: {report.profiles?.email || "unknown"}
                    </p>
                  </div>

                  <span className="rounded-full border px-3 py-1 text-sm font-medium">
                    {report.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">Reason</p>
                    <p className="mt-1 font-semibold">{report.reason}</p>
                  </div>

                  <div className="rounded-2xl border bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-500">Details</p>
                    <p className="mt-1">{report.details || "No details provided."}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/listing/${report.listing_id}`}
                    className="rounded-xl border px-4 py-2 font-medium hover:bg-gray-50"
                  >
                    View Listing
                  </Link>

                  <ReportActionButtons
                    reportId={report.id}
                    listingId={report.listing_id}
                    currentStatus={report.status}
                  />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}