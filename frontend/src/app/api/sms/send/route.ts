import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth-server";
import { ensureWorkspace } from "@/lib/workspace-server";
import { isTwilioConfigured, sendSms } from "@/lib/twilio-server";
import {
  addContactActivityAdmin,
  getWorkspacePrimaryNumber,
  isContactOptedOut,
  recordMessage,
} from "@/services/messaging-server";

export const runtime = "nodejs";

const SendSchema = z.object({
  to: z.string().trim().min(5).max(30),
  body: z.string().trim().min(1).max(1600),
  contactId: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  if (!isTwilioConfigured()) {
    return NextResponse.json(
      { error: "SMS is not configured yet. Add your Twilio credentials." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { to, body: text, contactId } = parsed.data;

  const { workspaceId } = await ensureWorkspace(auth.uid);

  // Compliance gate: never text a contact who has opted out.
  if (contactId && (await isContactOptedOut(contactId))) {
    return NextResponse.json(
      { error: "This contact has opted out of SMS." },
      { status: 403 }
    );
  }

  const workspacePhone = await getWorkspacePrimaryNumber(workspaceId);
  if (!workspacePhone) {
    return NextResponse.json(
      { error: "No sending number is attached to your workspace." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const statusCallback = appUrl ? `${appUrl}/api/sms/status` : undefined;

  try {
    const sent = await sendSms({ to, body: text, statusCallback });
    const { conversationId, messageId } = await recordMessage({
      workspaceId,
      workspacePhone,
      contactPhone: to,
      contactId: contactId ?? null,
      direction: "outbound",
      body: text,
      status: (sent.status as never) ?? "sent",
      twilioSid: sent.sid,
    });
    if (contactId) {
      await addContactActivityAdmin({
        workspaceId,
        contactId,
        type: "sms",
        body: text,
        direction: "outbound",
        createdBy: auth.uid,
      });
    }
    return NextResponse.json({ success: true, conversationId, messageId });
  } catch (err) {
    console.error("SMS send failed:", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 502 });
  }
}
