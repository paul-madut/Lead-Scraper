// Cron entrypoint that advances due sequence enrollments. Vercel Cron calls
// this on a schedule (see vercel.json). Secured by CRON_SECRET: Vercel sends
// it as a Bearer token automatically when the env var is set.
import { NextResponse } from "next/server";
import { processDueEnrollments } from "@/services/flows-server";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // unset in dev - allow
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const summary = await processDueEnrollments(50);
  return NextResponse.json({ success: true, ...summary });
}

export const GET = handle;
export const POST = handle;
