import Link from "next/link";

export default function ConfirmedPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold">Email confirmed</h1>
        <p className="mt-3 text-sm text-gray-600">
          Your school email has been verified successfully.
        </p>

        <div className="mt-6 space-y-3">
          <Link
            href="/profile"
            className="block w-full rounded-xl bg-black py-3 font-medium text-white"
          >
            Go to Profile
          </Link>

          <Link
            href="/"
            className="block w-full rounded-xl border py-3 font-medium"
          >
            DormSweep Home
          </Link>
        </div>
      </div>
    </main>
  );
}