"use client";

import { MapContainer, TileLayer, Polyline, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type StopPoint = { name: string; lat: number; lng: number };

// A numbered teal pin — drawn with HTML so we don't depend on image assets.
function numberIcon(n: number) {
  return L.divIcon({
    className: "",
    html: `<div style="background:#0d9488;color:#fff;width:24px;height:24px;border-radius:999px;display:flex;align-items:center;justify-content:center;font:600 12px system-ui,sans-serif;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${n}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function ItineraryMap({
  stops,
  height = 220,
}: {
  stops: StopPoint[];
  height?: number;
}) {
  if (!stops.length) return null;

  const positions = stops.map((s) => [s.lat, s.lng] as [number, number]);
  const single = positions.length === 1;

  return (
    <MapContainer
      {...(single
        ? { center: positions[0], zoom: 9 }
        : { bounds: L.latLngBounds(positions), boundsOptions: { padding: [28, 28] as [number, number] } })}
      scrollWheelZoom={false}
      style={{ height, width: "100%" }}
      className="z-0 rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {!single && (
        <Polyline
          positions={positions}
          pathOptions={{ color: "#0d9488", weight: 3, dashArray: "6 8" }}
        />
      )}
      {stops.map((s, i) => (
        <Marker key={`${s.name}-${i}`} position={positions[i]} icon={numberIcon(i + 1)}>
          <Tooltip>{s.name}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
