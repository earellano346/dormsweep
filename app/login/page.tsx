"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("message");
    if (msg) setMessage(msg);
  }, []);

  async function syncSchool() {
    const response = await fetch("/auth/sync-school", {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to sync school.");
    }

    return data;
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSigningIn(true);

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail || !password.trim()) {
      setSigningIn(false);
      setErrorMessage("Please fill out all fields.");
      return;
    }

    if (!normalizedEmail.endsWith(".edu")) {
      setSigningIn(false);
      setErrorMessage("You must use a .edu email address.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setSigningIn(false);
      setErrorMessage(error.message);
      return;
    }

    try {
      await syncSchool();
    } catch (err: any) {
      setSigningIn(false);
      setErrorMessage(err.message || "Failed to sync school.");
      return;
    }

    setSigningIn(false);

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");

    router.push(next || "/profile");
    router.refresh();
  }

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="text-3xl font-bold">Log In</h1>
        <p className="mt-2 text-sm text-gray-600">
          Access DormSweep with your verified school email.
        </p>

        {message && (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSignIn} className="mt-6 space-y-4">
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

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Password</label>
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 underline hover:text-black"
              >
                Forgot password?
              </Link>
            </div>

            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-4 py-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={signingIn}
            className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:opacity-50"
          >
            {signingIn ? "Signing In..." : "Log In"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link
            href="/resend-verification"
            className="text-gray-600 underline hover:text-black"
          >
            Resend verification email
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-600">Don’t have an account yet?</p>
          <Link
            href="/signup"
            className="mt-3 inline-block rounded-xl border px-4 py-2 font-medium hover:bg-gray-100"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}