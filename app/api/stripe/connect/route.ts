import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // check if user already has stripe account
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();

  let accountId = profile?.stripe_account_id;

  // if not → create one
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
    });

    accountId = account.id;

    await supabase
      .from("profiles")
      .update({ stripe_account_id: accountId })
      .eq("id", user.id);
  }

  // create onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/profile`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}