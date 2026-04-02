"use client";

export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-dusk-blue border-2 border-sapphire-sky rounded-full p-6 animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          <div className="h-4 bg-sapphire-sky/30 rounded-full w-3/4 mb-3" />
          <div className="h-3 bg-sapphire-sky/20 rounded-full w-1/2 mb-2" />
          <div className="h-8 bg-sapphire-sky/20 rounded-full w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function MapLoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-twilight-indigo/80 flex items-center justify-center z-10">
      <div className="text-center">
        <div className="font-fraunces text-2xl font-bold text-alice-blue mb-2">
          Loading Map
        </div>
        <div className="text-sm text-alice-blue/60">
          Preparing Harris County data...
        </div>
      </div>
    </div>
  );
}
