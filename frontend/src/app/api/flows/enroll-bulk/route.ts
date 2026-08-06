import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { ensureWorkspace } from "@/lib/workspace-server";
import { enrollContactsBulk } from "@/services/flows-server";

export const runtime = "nodejs";

const BulkEnrollSchema = z.object({
  sequenceId: z.string().min(1).max(200),
  contactIds: z.array(z.string().min(1).max(200)).min(1).max(500),
  // ISO 8601; when the batch's first send should fire. Optional = now.
  startAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = BulkEnrollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { workspaceId } = await ensureWorkspace(auth.uid);
  const result = await enrollContactsBulk({
    workspaceId,
    sequenceId: parsed.data.sequenceId,
    contactIds: parsed.data.contactIds,
    startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
  });

  return NextResponse.json({ success: true, ...result });
}
