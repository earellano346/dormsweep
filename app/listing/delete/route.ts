import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function getStoragePathFromPublicUrl(url: string) {
  const marker = "/storage/v1/object/public/listing-images/";
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return url.substring(index + marker.length);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const formData = await request.formData();
  const listingId = formData.get("listingId")?.toString();

  if (!listingId) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (!profile?.school_id) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id, school_id")
    .eq("id", listingId)
    .single();

  if (
    !listing ||
    listing.seller_id !== user.id ||
    listing.school_id !== profile.school_id
  ) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  const { data: images } = await supabase
    .from("listing_images")
    .select("image_url")
    .eq("listing_id", listingId);

  const filePaths =
    images
      ?.map((img) => getStoragePathFromPublicUrl(img.image_url))
      .filter((path): path is string => Boolean(path)) ?? [];

  if (filePaths.length > 0) {
    await supabase.storage.from("listing-images").remove(filePaths);
  }

  await supabase.from("listings").delete().eq("id", listingId);

  return NextResponse.redirect(new URL("/profile", request.url));
}