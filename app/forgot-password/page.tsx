"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setSubmitting(true);

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail) {
      setSubmitting(false);
      setErrorMessage("Please enter your email.");
      return;
    }

    if (!normalizedEmail.endsWith(".edu")) {
      setSubmitting(false);
      setErrorMessage("You must use a .edu email address.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(
      "Password reset email sent. Check your inbox and follow the link."
    );
  }

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="text-3xl font-bold">Forgot Password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Enter your school email and we’ll send you a password reset link.
        </p>

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleResetRequest} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">School Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border px-4 py-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send Reset Email"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm underline hover:text-black">
            Back to Log In
          </Link>
        </div>
      </div>
    </main>
  );
}