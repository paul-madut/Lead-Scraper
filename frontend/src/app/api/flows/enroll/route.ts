import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { ensureWorkspace } from "@/lib/workspace-server";
import { enrollContact } from "@/services/flows-server";

export const runtime = "nodejs";

const EnrollSchema = z.object({
  sequenceId: z.string().min(1).max(200),
  contactId: z.string().min(1).max(200),
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
  const parsed = EnrollSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { workspaceId } = await ensureWorkspace(auth.uid);
  const result = await enrollContact({
    workspaceId,
    sequenceId: parsed.data.sequenceId,
    contactId: parsed.data.contactId,
  });

  if (!result.enrolled) {
    return NextResponse.json({ success: false, reason: result.reason }, { status: 409 });
  }
  return NextResponse.json({ success: true });
}
