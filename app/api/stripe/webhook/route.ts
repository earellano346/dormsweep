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

  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SITE_URL" },
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
      const purchaseDate = new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      const logoUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      const listingUrl = `${siteUrl}/listing/${listingId}`;
      const profileUrl = `${siteUrl}/profile`;

      const emailShell = ({
        heading,
        subheading,
        badge,
        bodyHtml,
        buttonLabel,
        buttonHref,
        footerText,
      }: {
        heading: string;
        subheading: string;
        badge: string;
        bodyHtml: string;
        buttonLabel: string;
        buttonHref: string;
        footerText: string;
      }) => `
        <div style="margin:0;padding:32px 16px;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
          <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.06);">
            <div style="padding:28px 32px 20px 32px;background:linear-gradient(135deg,#ffffff 0%,#f9fafb 100%);border-bottom:1px solid #e5e7eb;">
              <div style="text-align:center;">
                <img
                  src="${logoUrl}"
                  alt="DormSweep"
                  style="height:64px;max-width:220px;object-fit:contain;"
                />
              </div>

              <div style="margin-top:18px;text-align:center;">
                <span style="display:inline-block;padding:6px 12px;border:1px solid #d1fae5;background:#ecfdf5;color:#047857;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.02em;">
                  ${badge}
                </span>

                <h1 style="margin:16px 0 8px 0;font-size:30px;line-height:1.2;color:#111827;">
                  ${heading}
                </h1>

                <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.6;">
                  ${subheading}
                </p>
              </div>
            </div>

            <div style="padding:28px 32px;">
              ${bodyHtml}

              <div style="margin-top:28px;text-align:center;">
                <a
                  href="${buttonHref}"
                  style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700;font-size:14px;"
                >
                  ${buttonLabel}
                </a>
              </div>
            </div>

            <div style="padding:18px 32px;border-top:1px solid #e5e7eb;background:#f9fafb;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;text-align:center;">
                ${footerText}
              </p>
            </div>
          </div>
        </div>
      `;

      const buyerBodyHtml = `
        <div style="display:grid;gap:16px;">
          <div style="border:1px solid #e5e7eb;border-radius:16px;background:#f9fafb;padding:18px;">
            <h2 style="margin:0 0 12px 0;font-size:18px;color:#111827;">Order Summary</h2>
            <p style="margin:0 0 8px 0;"><strong>Item:</strong> ${itemTitle}</p>
            <p style="margin:0 0 8px 0;"><strong>Price:</strong> $${itemPrice}</p>
            <p style="margin:0;"><strong>Purchased:</strong> ${purchaseDate}</p>
          </div>

          <div style="border:1px solid #dbeafe;border-radius:16px;background:#eff6ff;padding:18px;">
            <h2 style="margin:0 0 12px 0;font-size:18px;color:#1d4ed8;">Pickup Details</h2>
            <p style="margin:0 0 8px 0;"><strong>Pickup location:</strong> ${pickupLocation}</p>
            <p style="margin:0;"><strong>Seller phone:</strong> ${sellerPhone}</p>
          </div>

          <div style="border:1px solid #e5e7eb;border-radius:16px;background:#ffffff;padding:18px;">
            <p style="margin:0;color:#374151;line-height:1.7;">
              Reach out to the seller to coordinate pickup. For safety, meet in a public place on campus.
            </p>
          </div>
        </div>
      `;

      const sellerBodyHtml = `
        <div style="display:grid;gap:16px;">
          <div style="border:1px solid #e5e7eb;border-radius:16px;background:#f9fafb;padding:18px;">
            <h2 style="margin:0 0 12px 0;font-size:18px;color:#111827;">Sale Summary</h2>
            <p style="margin:0 0 8px 0;"><strong>Item:</strong> ${itemTitle}</p>
            <p style="margin:0 0 8px 0;"><strong>Sale price:</strong> $${itemPrice}</p>
            <p style="margin:0;"><strong>Sold:</strong> ${purchaseDate}</p>
          </div>

          <div style="border:1px solid #dcfce7;border-radius:16px;background:#f0fdf4;padding:18px;">
            <h2 style="margin:0 0 12px 0;font-size:18px;color:#15803d;">Buyer Info</h2>
            <p style="margin:0;"><strong>Buyer email:</strong> ${buyerEmail || "Not available"}</p>
          </div>

          <div style="border:1px solid #e5e7eb;border-radius:16px;background:#ffffff;padding:18px;">
            <p style="margin:0;color:#374151;line-height:1.7;">
              Log in to DormSweep and coordinate pickup with the buyer.
            </p>
          </div>
        </div>
      `;

      if (buyerEmail) {
        const buyerEmailResult = await resend.emails.send({
          from: process.env.PURCHASE_FROM_EMAIL,
          to: buyerEmail,
          subject: `Your DormSweep purchase: ${itemTitle}`,
          html: emailShell({
            heading: "Purchase Confirmed",
            subheading: `You successfully swept up ${itemTitle}.`,
            badge: "PAYMENT SUCCESSFUL",
            bodyHtml: buyerBodyHtml,
            buttonLabel: "View Item",
            buttonHref: listingUrl,
            footerText:
              "DormSweep receipt and pickup details. Keep this email for your records.",
          }),
        });

        console.log("Buyer email result:", buyerEmailResult);

        if ((buyerEmailResult as any)?.error) {
          throw new Error(
            `Buyer email failed: ${JSON.stringify((buyerEmailResult as any).error)}`
          );
        }
      } else {
        console.warn("No buyer email found for purchase", {
          listingId,
          buyerId,
          customerEmail: session.customer_email,
          customerDetailsEmail: session.customer_details?.email,
        });
      }

      if (sellerEmail) {
        const sellerEmailResult = await resend.emails.send({
          from: process.env.PURCHASE_FROM_EMAIL,
          to: sellerEmail,
          subject: `Your listing sold: ${itemTitle}`,
          html: emailShell({
            heading: "Your Listing Sold",
            subheading: `${itemTitle} was purchased on DormSweep.`,
            badge: "ITEM SOLD",
            bodyHtml: sellerBodyHtml,
            buttonLabel: "Go to Profile",
            buttonHref: profileUrl,
            footerText:
              "DormSweep seller notification. You can coordinate with the buyer from your account.",
          }),
        });

        console.log("Seller email result:", sellerEmailResult);

        if ((sellerEmailResult as any)?.error) {
          throw new Error(
            `Seller email failed: ${JSON.stringify((sellerEmailResult as any).error)}`
          );
        }
      } else {
        console.warn("No seller email found for sale", {
          listingId,
          sellerId: listingBeforeUpdate.seller_id,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler failed:", err);
    return NextResponse.json(
      { error: err.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}