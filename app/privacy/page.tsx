export default function PrivacyPage() {
  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Effective Date: April 14, 2026</p>

        <div className="mt-6 space-y-5 text-sm leading-6 text-gray-700">
          <section>
            <h2 className="font-semibold text-black">1. Information We Collect</h2>
            <p>
              DormSweep may collect your name, school email, phone number, listing
              information, and transaction-related data.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">2. How We Use Information</h2>
            <p>
              We use your information to create and manage accounts, enable buying and
              selling, process payments, and improve the platform.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">3. Sharing of Information</h2>
            <p>
              DormSweep does not sell personal information. Limited information may be
              shared with payment providers and with other users after a completed
              purchase when necessary to complete a transaction.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">4. Data Security</h2>
            <p>
              We take reasonable steps to protect your information, but no platform is
              completely secure.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">5. User Responsibility</h2>
            <p>
              You are responsible for protecting your account and being thoughtful about
              the information you share.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">6. Cookies and Tracking</h2>
            <p>
              DormSweep may use basic cookies or similar technologies to improve user
              experience and site functionality.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">7. Changes to This Policy</h2>
            <p>
              We may update this policy over time. Continued use of DormSweep means you
              accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">8. Contact</h2>
            <p>For privacy-related questions, contact: support@dormsweepco.com</p>
          </section>
        </div>
      </div>
    </main>
  );
}