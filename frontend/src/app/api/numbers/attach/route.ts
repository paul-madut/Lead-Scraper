// Attach a Twilio number you already own to your workspace, so inbound texts
// to it route to your CRM. (Buying numbers in-app comes later.)
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { ensureWorkspace } from "@/lib/workspace-server";
import { attachNumber } from "@/services/messaging-server";

export const runtime = "nodejs";

const AttachSchema = z.object({
  phoneNumber: z.string().trim().regex(/^\+?[1-9]\d{6,14}$/, "Use E.164 format, e.g. +16135550123"),
  label: z.string().trim().max(60).optional(),
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
  const parsed = AttachSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { workspaceId } = await ensureWorkspace(auth.uid);
  await attachNumber({
    workspaceId,
    phoneNumber: parsed.data.phoneNumber,
    label: parsed.data.label,
  });
  return NextResponse.json({ success: true });
}
