// Detach a Twilio number from your workspace.
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { ensureWorkspace } from "@/lib/workspace-server";
import { removeNumber } from "@/services/messaging-server";

export const runtime = "nodejs";

const RemoveSchema = z.object({
  phoneNumber: z.string().trim().regex(/^\+?[1-9]\d{6,14}$/, "Use E.164 format"),
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
  const parsed = RemoveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { workspaceId } = await ensureWorkspace(auth.uid);
  await removeNumber({ workspaceId, phoneNumber: parsed.data.phoneNumber });
  return NextResponse.json({ success: true });
}
