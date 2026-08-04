import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { ensureWorkspace } from "@/lib/workspace-server";
import { getWorkspacePrimaryNumber } from "@/services/messaging-server";
import { logCall } from "@/services/calls-server";

export const runtime = "nodejs";

const LogSchema = z.object({
  to: z.string().trim().min(3).max(30),
  contactId: z.string().max(200).optional(),
  outcome: z.enum(["completed", "no-answer", "busy", "failed", "canceled"]),
  durationSec: z.coerce.number().int().min(0).max(86400).default(0),
  twilioCallSid: z.string().max(64).optional(),
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
  const parsed = LogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { workspaceId } = await ensureWorkspace(auth.uid);
  const from = (await getWorkspacePrimaryNumber(workspaceId)) ?? "";

  const id = await logCall({
    workspaceId,
    contactId: parsed.data.contactId ?? null,
    direction: "outbound",
    from,
    to: parsed.data.to,
    outcome: parsed.data.outcome,
    durationSec: parsed.data.durationSec,
    twilioCallSid: parsed.data.twilioCallSid ?? null,
    createdBy: auth.uid,
  });

  return NextResponse.json({ success: true, id });
}
