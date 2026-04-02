"use client";

interface MapControlsProps {
  overlays: { flood: boolean; cancer: boolean; listings: boolean };
  onToggle: (layer: "flood" | "cancer" | "listings") => void;
}

export default function MapControls({ overlays, onToggle }: MapControlsProps) {
  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <OverlayToggle
        label="Flood Zones"
        active={overlays.flood}
        color="bg-sapphire-sky"
        onClick={() => onToggle("flood")}
      />
      <OverlayToggle
        label="Cancer Risk"
        active={overlays.cancer}
        color="bg-score-fair"
        onClick={() => onToggle("cancer")}
      />
      <OverlayToggle
        label="Listings"
        active={overlays.listings}
        color="bg-emerald"
        onClick={() => onToggle("listings")}
      />
    </div>
  );
}

function OverlayToggle({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border-2 transition-all duration-200 ${
        active
          ? "bg-dusk-blue border-fresh-sky text-alice-blue"
          : "bg-dusk-blue/80 border-sapphire-sky/50 text-alice-blue/60"
      }`}
    >
      <span
        className={`w-3 h-3 ${color} ${active ? "opacity-100" : "opacity-30"}`}
      />
      {label}
    </button>
  );
}
