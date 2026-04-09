import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50 -mx-6 -my-6 p-6">
      <div className="max-w-2xl mx-auto bg-white border rounded-2xl p-8 shadow-sm text-center">
        <h1 className="text-3xl font-bold">Payment successful</h1>
        <p className="mt-3 text-gray-600">
          Your order went through successfully.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/browse"
            className="bg-black text-white px-5 py-3 rounded-xl font-medium"
          >
            Back to Browse
          </Link>

          <Link
            href="/profile"
            className="border px-5 py-3 rounded-xl font-medium"
          >
            Go to Profile
          </Link>
        </div>
      </div>
    </main>
  );
}