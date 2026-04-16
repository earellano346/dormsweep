import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";

function isAllowedAdmin(email?: string | null) {
  const allowed = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return !!email && allowed.includes(email.toLowerCase());
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAllowedAdmin(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportId } = await params;
  const { action, listingId } = await req.json();

  try {
    if (action === "reviewed") {
      const { error } = await adminSupabase
        .from("listing_reports")
        .update({ status: "reviewed" })
        .eq("id", reportId);

      if (error) throw error;
    }

    if (action === "dismissed") {
      const { error } = await adminSupabase
        .from("listing_reports")
        .update({ status: "dismissed" })
        .eq("id", reportId);

      if (error) throw error;
    }

    if (action === "remove_listing") {
      const { error: listingError } = await adminSupabase
        .from("listings")
        .update({ status: "removed" })
        .eq("id", listingId);

      if (listingError) throw listingError;

      const { error: reportError } = await adminSupabase
        .from("listing_reports")
        .update({ status: "listing_removed" })
        .eq("id", reportId);

      if (reportError) throw reportError;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Action failed" },
      { status: 500 }
    );
  }
}