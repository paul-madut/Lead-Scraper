// app/api/photo/route.ts - proxies Google Places photos using the server-side
// key, so no Maps key is ever exposed to the browser.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const maxwidth = searchParams.get("w") ?? "400";

  if (!ref || !/^[A-Za-z0-9_-]+$/.test(ref)) {
    return NextResponse.json({ error: "Invalid photo reference" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const width = Math.min(Math.max(parseInt(maxwidth, 10) || 400, 40), 1200);
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${width}&photo_reference=${ref}&key=${apiKey}`;

  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Photo unavailable" }, { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
