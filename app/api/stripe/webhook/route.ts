import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { stripe } from "@/lib/stripe";
import { adminSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY" },
      { status: 500 }
    );
  }

  if (!process.env.PURCHASE_FROM_EMAIL) {
    return NextResponse.json(
      { error: "Missing PURCHASE_FROM_EMAIL" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const listingId = session.metadata?.listing_id;
      const buyerId = session.metadata?.buyer_id;

      if (!listingId || !buyerId) {
        return NextResponse.json(
          { error: "Missing listing_id or buyer_id in metadata" },
          { status: 400 }
        );
      }

      const { data: listingBeforeUpdate, error: listingLookupError } =
        await adminSupabase
          .from("listings")
          .select("*")
          .eq("id", listingId)
          .single();

      if (listingLookupError || !listingBeforeUpdate) {
        return NextResponse.json(
          { error: "Could not load listing before update" },
          { status: 500 }
        );
      }

      const { error: updateError } = await adminSupabase
        .from("listings")
        .update({
          status: "sold",
          buyer_id: buyerId,
          sold_at: new Date().toISOString(),
        })
        .eq("id", listingId)
        .eq("status", "active");

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to mark listing sold: ${updateError.message}` },
          { status: 500 }
        );
      }

      const { data: sellerProfile } = await adminSupabase
        .from("profiles")
        .select("email")
        .eq("id", listingBeforeUpdate.seller_id)
        .single();

      const { data: buyerProfile } = await adminSupabase
        .from("profiles")
        .select("email")
        .eq("id", buyerId)
        .single();

      const buyerEmail =
        session.customer_details?.email ||
        session.customer_email ||
        buyerProfile?.email ||
        "";

      const sellerEmail = sellerProfile?.email || "";
      const sellerPhone = listingBeforeUpdate.phone_number || "Not provided";
      const pickupLocation = listingBeforeUpdate.pickup_location || "Not provided";
      const itemTitle = listingBeforeUpdate.title || "DormSweep item";
      const itemPrice = ((listingBeforeUpdate.price_cents ?? 0) / 100).toFixed(2);
      const logoUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`;

      if (buyerEmail) {
        await resend.emails.send({
          from: process.env.PURCHASE_FROM_EMAIL,
          to: buyerEmail,
          subject: `Your DormSweep purchase: ${itemTitle}`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;background:#f9fafb;padding:24px;">
              <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
                <div style="text-align:center;margin-bottom:24px;">
                  <img src="${logoUrl}" alt="DormSweep" style="height:64px;max-width:220px;object-fit:contain;" />
                </div>

                <h2 style="margin:0 0 12px 0;font-size:28px;">Purchase Confirmed</h2>
                <p style="margin:0 0 20px 0;color:#4b5563;">
                  You successfully swept up <strong>${itemTitle}</strong>.
                </p>

                <div style="margin:16px 0;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;">
                  <p style="margin:0 0 8px 0;"><strong>Item:</strong> ${itemTitle}</p>
                  <p style="margin:0 0 8px 0;"><strong>Price:</strong> $${itemPrice}</p>
                  <p style="margin:0 0 8px 0;"><strong>Pickup location:</strong> ${pickupLocation}</p>
                  <p style="margin:0;"><strong>Seller phone:</strong> ${sellerPhone}</p>
                </div>

                <p style="margin:20px 0 0 0;color:#374151;">
                  Reach out to the seller to coordinate pickup. Meet in a safe, public place on campus.
                </p>

                <p style="margin-top:24px;font-size:12px;color:#6b7280;">
                  DormSweep receipt and pickup details
                </p>
              </div>
            </div>
          `,
        });
      }

      if (sellerEmail) {
        await resend.emails.send({
          from: process.env.PURCHASE_FROM_EMAIL,
          to: sellerEmail,
          subject: `Your listing sold: ${itemTitle}`,
          html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;background:#f9fafb;padding:24px;">
              <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
                <div style="text-align:center;margin-bottom:24px;">
                  <img src="${logoUrl}" alt="DormSweep" style="height:64px;max-width:220px;object-fit:contain;" />
                </div>

                <h2 style="margin:0 0 12px 0;font-size:28px;">Your listing sold</h2>
                <p style="margin:0 0 20px 0;color:#4b5563;">
                  Your listing <strong>${itemTitle}</strong> was purchased on DormSweep.
                </p>

                <div style="margin:16px 0;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb;">
                  <p style="margin:0 0 8px 0;"><strong>Item:</strong> ${itemTitle}</p>
                  <p style="margin:0 0 8px 0;"><strong>Sale price:</strong> $${itemPrice}</p>
                  <p style="margin:0;"><strong>Buyer email:</strong> ${buyerEmail || "Not available"}</p>
                </div>

                <p style="margin:20px 0 0 0;color:#374151;">
                  Log in to DormSweep and coordinate pickup with the buyer.
                </p>

                <p style="margin-top:24px;font-size:12px;color:#6b7280;">
                  DormSweep seller sale notification
                </p>
              </div>
            </div>
          `,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}