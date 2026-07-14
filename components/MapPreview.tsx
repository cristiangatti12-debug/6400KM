"use client";

import dynamic from "next/dynamic";
import type { StopPoint } from "@/components/ItineraryMap";

// Leaflet needs the browser, so the map is loaded only on the client.
const ItineraryMap = dynamic(() => import("@/components/ItineraryMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] w-full animate-pulse rounded-xl bg-muted" />
  ),
});

export function MapPreview({
  stops,
  height,
}: {
  stops: StopPoint[];
  height?: number;
}) {
  if (!stops?.length) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <ItineraryMap stops={stops} height={height} />
    </div>
  );
}
