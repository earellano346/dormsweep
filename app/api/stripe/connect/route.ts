import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: `Profile lookup failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    let accountId = profile?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email ?? undefined,
      });

      accountId = account.id;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", user.id);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to save Stripe account: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!siteUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SITE_URL is missing in environment variables." },
        { status: 500 }
      );
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${siteUrl}/profile`,
      return_url: `${siteUrl}/profile`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error("Stripe connect route error:", error);
    return NextResponse.json(
      { error: error?.message || "Stripe connect failed." },
      { status: 500 }
    );
  }
}