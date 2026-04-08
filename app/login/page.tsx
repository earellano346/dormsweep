"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail.endsWith(".edu")) {
      setLoading(false);
      alert("You must use a .edu email address.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      setLoading(false);
      alert(signInError.message);
      return;
    }

    try {
      await syncSchool();
    } catch (err: any) {
      setLoading(false);
      alert(err.message);
      return;
    }

    setLoading(false);
    router.push("/profile");
    router.refresh();
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail.endsWith(".edu")) {
      setLoading(false);
      alert("You must use a .edu email address.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    try {
      await syncSchool();
    } catch (err: any) {
      setLoading(false);
      alert(err.message);
      return;
    }

    setLoading(false);
    router.push("/profile");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gray-50 -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">DormSweep Login</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign up or sign in with your school email.
        </p>

        <form className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-xl border px-4 py-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-4 py-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Loading..." : "Sign In"}
          </button>

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full rounded-xl border py-3 font-medium disabled:opacity-50"
          >
            {loading ? "Loading..." : "Create Account"}
          </button>
        </form>
      </div>
    </main>
  );
}