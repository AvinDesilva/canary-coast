import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canary Coast — Harris County Housing Safety Scores",
  description:
    "A map-based web app overlaying Harris County housing listings with environmental safety scores derived from cancer prevalence and flood zone risk.",
  openGraph: {
    title: "Canary Coast",
    description:
      "Harris County housing listings scored for cancer risk and flood zone danger.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
