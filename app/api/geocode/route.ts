import { type NextRequest, NextResponse } from "next/server";

// Turns a place name ("Lisbon") into coordinates, using OpenStreetMap's
// free Nominatim geocoder. We call it from the server so we can send a
// proper User-Agent (their usage policy requires it) and cache results.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ result: null }, { status: 400 });
  }

  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(q);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Serai/1.0 (https://6400-km.vercel.app)",
        "Accept-Language": "en",
      },
      // Cache each place for a day — place coordinates don't move.
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ result: null });

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
    }>;
    const hit = data?.[0];
    if (!hit) return NextResponse.json({ result: null });

    return NextResponse.json({
      result: {
        name: q,
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        label: hit.display_name,
      },
    });
  } catch {
    return NextResponse.json({ result: null });
  }
}
