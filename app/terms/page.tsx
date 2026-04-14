export default function TermsPage() {
  return (
    <main className="min-h-screen -mx-6 -my-6 p-6">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">Effective Date: April 14, 2026</p>

        <div className="mt-6 space-y-5 text-sm leading-6 text-gray-700">
          <section>
            <h2 className="font-semibold text-black">1. Platform Overview</h2>
            <p>
              DormSweep is a student marketplace that connects students to buy and sell
              items within their campus community. DormSweep does not own, inspect, or
              guarantee items listed on the platform.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">2. User Responsibility</h2>
            <p>
              Users are responsible for the accuracy of their listings, the legality and
              condition of items they sell, and communicating and meeting safely with
              other users. DormSweep is not responsible for disputes between users.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">3. Payments</h2>
            <p>
              Payments are processed through third-party providers such as Stripe.
              DormSweep may charge a service fee on transactions. Unless otherwise stated,
              completed payments are final.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">4. Prohibited Items</h2>
            <p>
              Users may not list or sell illegal items, weapons, drugs, stolen goods, or
              items that violate applicable laws or campus policies. DormSweep may remove
              any listing at any time.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">5. Safety</h2>
            <p>
              Users are responsible for meeting in safe, public locations. DormSweep does
              not supervise meetups or physical exchanges.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">6. Account Use</h2>
            <p>
              You must use a valid school email, keep your login secure, and not
              impersonate others. DormSweep may suspend accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">7. Limitation of Liability</h2>
            <p>
              DormSweep is not responsible for item quality, listing accuracy, failed
              transactions, injuries, or damages resulting from meetups or exchanges.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">8. Changes to Terms</h2>
            <p>
              We may update these Terms at any time. Continued use of DormSweep means you
              accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-black">9. Contact</h2>
            <p>For support, contact: support@dormsweepco.com</p>
          </section>
        </div>
      </div>
    </main>
  );
}