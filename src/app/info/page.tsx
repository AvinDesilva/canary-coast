"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "methodology" | "privacy";

export default function InfoPage() {
  const [tab, setTab] = useState<Tab>("methodology");

  return (
    <div className="min-h-screen bg-twilight-indigo text-alice-blue">
      <div className="max-w-2xl mx-auto p-8">
        <div className="mb-6">
          <Link href="/" className="text-fresh-sky text-sm hover:underline">
            ← Back to map
          </Link>
        </div>

        <h1 className="font-fraunces text-3xl font-bold mb-6">More Info</h1>

        {/* Tab bar */}
        <div className="flex gap-2 mb-8 border-b-2 border-sapphire-sky pb-4">
          <TabButton active={tab === "methodology"} onClick={() => setTab("methodology")}>
            Data &amp; Methodology
          </TabButton>
          <TabButton active={tab === "privacy"} onClick={() => setTab("privacy")}>
            Privacy Notice
          </TabButton>
        </div>

        {tab === "methodology" ? <MethodologyTab /> : <PrivacyTab />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-2 transition-all duration-200 ${
        active
          ? "bg-fresh-sky text-twilight-indigo border-fresh-sky"
          : "bg-transparent text-alice-blue border-sapphire-sky hover:border-fresh-sky hover:text-fresh-sky"
      }`}
    >
      {children}
    </button>
  );
}

function MethodologyTab() {
  return (
    <div className="space-y-8 text-sm text-alice-blue/80 leading-relaxed">
      <section>
        <h2 className="font-fraunces text-lg font-bold text-alice-blue mb-3">
          What is Canary Coast?
        </h2>
        <p>
          Canary Coast overlays Harris County housing listings with environmental safety
          scores derived from publicly available government data. Each listing is scored on
          cancer incidence risk and flood risk for its census tract and FEMA flood zone.
          Scores are informational only — consult licensed professionals before making
          any purchasing decisions.
        </p>
      </section>

      <section>
        <h2 className="font-fraunces text-lg font-bold text-alice-blue mb-3">
          Risk Score Methodology
        </h2>
        <p className="mb-4">
          Each property receives a composite safety score from 0–100, where higher scores
          indicate lower environmental risk. The composite is a weighted blend of two components:
        </p>

        <div className="border-2 border-sapphire-sky p-4 mb-4 space-y-3">
          <div>
            <div className="font-fraunces font-bold text-alice-blue mb-1">
              Composite Score
            </div>
            <code className="text-fresh-sky text-xs bg-dusk-blue px-2 py-1 block">
              composite = (cancer_score × 40%) + (flood_score × 60%)
            </code>
          </div>

          <div>
            <div className="font-semibold text-alice-blue/90 mb-1">Cancer Risk Score (40%)</div>
            <p className="text-alice-blue/70 mb-1">
              Derived from the Standardized Incidence Ratio (SIR) of the census tract
              containing the property. SIR compares local cancer incidence to the Texas
              state average (SIR = 1.0 means equal to state average).
            </p>
            <code className="text-fresh-sky text-xs bg-dusk-blue px-2 py-1 block">
              cancer_score = clamp(0, 100, 100 − ((SIR − 0.5) / 1.5) × 100)
            </code>
          </div>

          <div>
            <div className="font-semibold text-alice-blue/90 mb-1">Flood Risk Score (60%)</div>
            <p className="text-alice-blue/70 mb-1">
              A blend of FEMA zone classification and historical flood frequency:
            </p>
            <code className="text-fresh-sky text-xs bg-dusk-blue px-2 py-1 block">
              flood_score = (fema_score × 50%) + (historical_score × 50%)
            </code>
            <div className="mt-2 space-y-1 text-xs text-alice-blue/60">
              <div>FEMA zone scores: minimal → 100, undetermined → 70, moderate → 40, high → 15, very high → 0</div>
              <div>Historical score: clamp(0, 100, 100 × (1 − event_count / 15))</div>
            </div>
          </div>
        </div>

        <div className="border-2 border-sapphire-sky p-4">
          <div className="font-fraunces font-bold text-alice-blue mb-2">Score Bands</div>
          <div className="space-y-1 text-xs">
            {[
              { label: "Low Risk", range: "80–100", color: "#e0e7ff" },
              { label: "Low-Moderate Risk", range: "60–79", color: "#a5b4fc" },
              { label: "Fair", range: "40–59", color: "#818cf8" },
              { label: "Caution", range: "20–39", color: "#c084fc" },
              { label: "High Risk", range: "0–19", color: "#4c1d95" },
            ].map(({ label, range, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 flex-shrink-0 border border-white/20"
                  style={{ backgroundColor: color }}
                />
                <span style={{ color }}>{label}</span>
                <span className="text-alice-blue/40 ml-auto">{range}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-3 text-xs text-alice-blue/40">
          Weights are developer-defined estimates, not published standards. The flood component
          is weighted higher because Harris County is subject to significant hurricane and
          tropical storm flooding risk.
        </p>
      </section>

      <section>
        <h2 className="font-fraunces text-lg font-bold text-alice-blue mb-3">
          Data Sources
        </h2>
        <div className="space-y-4">
          <DataSource
            name="Housing Listings"
            provider="Rentcast"
            description="Active and recently sold residential listings in Harris County. Data is cached for 7 days to stay within API limits."
            href="https://rentcast.io"
          />
          <DataSource
            name="Cancer Incidence (SIR)"
            provider="Harris County Public Health / Texas Cancer Registry"
            description="Standardized Incidence Ratios by census tract for 17 cancer types, study period 2013–2021. SIR compares local rates to the Texas state baseline."
            href="https://publichealth.harriscountytx.gov/Services-Programs/Programs/Cancer-Data-and-Epidemiology"
          />
          <DataSource
            name="FEMA Flood Zones"
            provider="FEMA National Flood Hazard Layer (NFHL)"
            description="Official Special Flood Hazard Area polygons for Harris County (DFIRM ID 48201C). Zones A/AE are 100-year (1% annual chance) flood areas; V/VE are high-velocity coastal zones."
            href="https://msc.fema.gov/portal/home"
          />
          <DataSource
            name="Historical Flood Events"
            provider="Harris County Flood Control District (HCFCD) — MAAPnext Program"
            description="Census tract–level flood impact data covering 365 distinct flood events from 1977–2019, including Hurricane Harvey (2017), Tropical Storm Imelda (2019), Tax Day Flood (2016), and Tropical Storm Allison (2001). Values represent flooded structure counts per event."
            href="https://www.maapnext.org/"
          />
          <DataSource
            name="Air Quality (PM2.5)"
            provider="PurpleAir"
            description="Real-time particulate matter readings from the nearest PurpleAir sensor network node. PM2.5 values are corrected using EPA's standard formula and converted to AQI."
            href="https://www2.purpleair.com/"
          />
          <DataSource
            name="Census Tract Boundaries"
            provider="US Census Bureau TIGER/Line (via HCPH FeatureServer)"
            description="Census tract polygons used for spatial joins. Harris County contains approximately 786 census tracts."
            href="https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html"
          />
        </div>
      </section>

      <section>
        <h2 className="font-fraunces text-lg font-bold text-alice-blue mb-3">
          Limitations
        </h2>
        <ul className="list-disc list-inside space-y-2 text-alice-blue/70">
          <li>Cancer SIR data is aggregated at the census tract level — individual property risk may differ.</li>
          <li>FEMA flood maps may not reflect recent changes to infrastructure, drainage improvements, or updated hydrological surveys.</li>
          <li>Historical flood data covers events through 2019 and does not include more recent storms.</li>
          <li>Air quality readings are from the nearest available PurpleAir sensor and may not reflect hyperlocal conditions.</li>
          <li>Score weights are developer-defined estimates. No official standard for composite environmental risk scoring exists.</li>
        </ul>
      </section>
    </div>
  );
}

function DataSource({
  name,
  provider,
  description,
  href,
}: {
  name: string;
  provider: string;
  description: string;
  href: string;
}) {
  return (
    <div className="border-l-2 border-sapphire-sky pl-4">
      <div className="flex items-start justify-between gap-4">
        <div className="font-fraunces font-bold text-alice-blue">{name}</div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-fresh-sky text-xs hover:underline flex-shrink-0"
        >
          Source ↗
        </a>
      </div>
      <div className="text-alice-blue/50 text-xs mb-1">{provider}</div>
      <p className="text-alice-blue/70">{description}</p>
    </div>
  );
}

function PrivacyTab() {
  return (
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
  );
}
