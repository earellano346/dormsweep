import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function getStoragePathFromPublicUrl(url: string) {
  const marker = "/storage/v1/object/public/listings_images/";
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return url.substring(index + marker.length);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: listingId } = await params;

  if (!listingId) {
    return NextResponse.json(
      { error: "Missing listing ID." },
      { status: 400 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in." },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.school_id) {
    return NextResponse.json(
      { error: "Could not verify your school profile." },
      { status: 403 }
    );
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, seller_id, school_id")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json(
      { error: "Listing not found." },
      { status: 404 }
    );
  }

  if (listing.seller_id !== user.id || listing.school_id !== profile.school_id) {
    return NextResponse.json(
      { error: "You are not allowed to delete this listing." },
      { status: 403 }
    );
  }

  const { data: images, error: imagesError } = await supabase
    .from("listing_images")
    .select("image_url")
    .eq("listing_id", listingId);

  if (imagesError) {
    return NextResponse.json(
      { error: "Could not load listing images." },
      { status: 500 }
    );
  }

  const filePaths =
    images
      ?.map((img) => getStoragePathFromPublicUrl(img.image_url))
      .filter((path): path is string => Boolean(path)) ?? [];

  if (filePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("listings_images")
      .remove(filePaths);

    if (storageError) {
      return NextResponse.json(
        { error: `Could not remove listing images: ${storageError.message}` },
        { status: 500 }
      );
    }
  }

  const { error: listingImagesDeleteError } = await supabase
    .from("listing_images")
    .delete()
    .eq("listing_id", listingId);

  if (listingImagesDeleteError) {
    return NextResponse.json(
      { error: `Could not remove image records: ${listingImagesDeleteError.message}` },
      { status: 500 }
    );
  }

  const { error: listingDeleteError } = await supabase
    .from("listings")
    .delete()
    .eq("id", listingId);

  if (listingDeleteError) {
    return NextResponse.json(
      { error: `Could not delete listing: ${listingDeleteError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}