"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const normalizedEmail = email.toLowerCase().trim();

    if (!fullName.trim()) {
      setCreating(false);
      alert("Enter your full name.");
      return;
    }

    if (!normalizedEmail.endsWith(".edu")) {
      setCreating(false);
      alert("You must use a .edu email address.");
      return;
    }

    if (!phoneNumber.trim()) {
      setCreating(false);
      alert("Enter your phone number.");
      return;
    }

    if (password.length < 6) {
      setCreating(false);
      alert("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setCreating(false);
      alert("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
        },
      },
    });

    setCreating(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push(
      "/login?message=Account created. Check your email to verify your account before logging in."
    );
    router.refresh();
  }

  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="text-3xl font-bold">Create Account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Sign up with your school email to join DormSweep.
        </p>

        <form onSubmit={handleSignUp} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border px-4 py-3"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

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
            <label className="block text-sm font-medium">Phone Number</label>
            <input
              type="tel"
              className="mt-1 w-full rounded-xl border px-4 py-3"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 555-5555"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-4 py-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-4 py-3"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-xl bg-black py-3 font-medium text-white disabled:opacity-50"
          >
            {creating ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-600">Already have an account?</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-3 inline-block rounded-xl border px-4 py-2 font-medium hover:bg-gray-100"
          >
            Back to Log In
          </button>
        </div>
      </div>
    </main>
  );
}