import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Notice — Canary Coast",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-twilight-indigo text-alice-blue p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="text-fresh-sky text-sm hover:underline"
        >
          ← Back to map
        </Link>
      </div>

      <h1 className="font-fraunces text-3xl font-bold mb-6">Privacy Notice</h1>

      <div className="space-y-6 text-sm text-alice-blue/80 leading-relaxed">
        <section>
          <h2 className="font-fraunces text-lg font-bold text-alice-blue mb-2">What data is collected</h2>
          <p>
            Canary Coast collects minimal data necessary to display housing and environmental
            information. Specifically:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-alice-blue/70">
            <li>
              <strong className="text-alice-blue">Session cookies</strong> — set by Supabase for
              map state management. These are not used for tracking or advertising.
            </li>
            <li>
              <strong className="text-alice-blue">Address searches</strong> — when you search for
              a property, the address is sent to our backend to retrieve listing and safety data via
              the Rentcast API. Searches are not stored with any user identifier.
            </li>
            <li>
              <strong className="text-alice-blue">Map viewport coordinates</strong> — your current
              map view (bounding box) is sent to our backend to load nearby listings. This is used
              only to serve relevant data and is not retained.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-fraunces text-lg font-bold text-alice-blue mb-2">How data is used</h2>
          <p>
            All data collected is used solely to provide the map display and property lookup
            features of this application. We do not use your data for advertising, profiling,
            or any purpose other than serving the application.
          </p>
        </section>

        <section>
          <h2 className="font-fraunces text-lg font-bold text-alice-blue mb-2">Data sharing</h2>
          <p>
            We do not sell, rent, or share your data with third parties. Property lookups are
            proxied through our backend to the Rentcast API; your searches are subject to
            Rentcast&apos;s own privacy policy. Environmental data (cancer incidence, flood zones,
            air quality) is fetched from public government sources and PurpleAir — no personal
            data is transmitted to those services.
          </p>
        </section>

        <section>
          <h2 className="font-fraunces text-lg font-bold text-alice-blue mb-2">No account required</h2>
          <p>
            Canary Coast does not require user registration. No name, email address, or payment
            information is collected.
          </p>
        </section>

        <section>
          <h2 className="font-fraunces text-lg font-bold text-alice-blue mb-2">Contact</h2>
          <p>
            This application is operated as an independent research project. For privacy-related
            questions, please open an issue on the project repository.
          </p>
        </section>

        <p className="text-alice-blue/40 text-xs pt-4 border-t border-sapphire-sky/30">
          Last updated: April 2026. Canary Coast is subject to the Texas Data Privacy and
          Security Act (TDPSA).
        </p>
      </div>
    </div>
  );
}
