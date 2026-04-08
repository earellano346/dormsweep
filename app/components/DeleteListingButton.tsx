"use client";

export default function DeleteListingButton({
  listingId,
}: {
  listingId: string;
}) {
  return (
    <form action="/listing/delete" method="post">
      <input type="hidden" name="listingId" value={listingId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Are you sure you want to delete this listing?")) {
            e.preventDefault();
          }
        }}
        className="border px-3 py-2 rounded-xl text-sm font-medium text-center text-red-600"
      >
        Delete
      </button>
    </form>
  );
}