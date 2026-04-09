import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { adminSupabase } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { listingId } = await req.json();

    const { data: listing, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .single();

    if (error || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.status !== "active") {
      return NextResponse.json(
        { error: "This listing is no longer available." },
        { status: 400 }
      );
    }

    if (listing.seller_id === user.id) {
      return NextResponse.json(
        { error: "You cannot buy your own listing." },
        { status: 400 }
      );
    }

    const { data: buyerProfile, error: buyerProfileError } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", user.id)
      .single();

    if (buyerProfileError || !buyerProfile?.school_id) {
      return NextResponse.json(
        { error: "Could not find your school profile." },
        { status: 400 }
      );
    }

    if (listing.school_id !== buyerProfile.school_id) {
      return NextResponse.json(
        { error: "You can only buy listings from your own school." },
        { status: 403 }
      );
    }

    const { data: seller, error: sellerError } = await adminSupabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", listing.seller_id)
      .single();

    if (sellerError) {
      return NextResponse.json(
        { error: `Seller lookup failed: ${sellerError.message}` },
        { status: 500 }
      );
    }

    if (!seller?.stripe_account_id) {
      return NextResponse.json(
        { error: "Seller is not connected to Stripe" },
        { status: 400 }
      );
    }

    const price = listing.price_cents ?? 0;

    let feePercent = 0.1;
    if (price >= 10000) feePercent = 0.05;
    else if (price >= 5000) feePercent = 0.08;

    const fee = Math.round(price * feePercent);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listing.title,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      customer_email: user.email ?? undefined,
      metadata: {
        listing_id: listing.id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount_cents: String(price),
        fee_cents: String(fee),
      },
      payment_intent_data: {
        application_fee_amount: fee,
        transfer_data: {
          destination: seller.stripe_account_id,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/listing/${listing.id}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout route error:", err);
    return NextResponse.json(
      { error: err.message || "Checkout failed" },
      { status: 500 }
    );
  }
}