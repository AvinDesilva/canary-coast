import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Canary Coast — Harris County Housing Safety Scores",
  description:
    "A map-based web app overlaying Harris County housing listings with environmental safety scores derived from cancer prevalence and flood zone risk.",
  openGraph: {
    title: "Canary Coast",
    description:
      "Harris County housing listings overlaid with FEMA flood zone classifications and Harris County cancer incidence data.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <footer className="fixed bottom-0 left-0 z-20 p-2" style={{ fontSize: "9px" }}>
          <Link
            href="/info"
            className="text-alice-blue/30 hover:text-alice-blue/60 underline transition-colors"
          >
            More Info
          </Link>
        </footer>
      </body>
    </html>
  );
}
