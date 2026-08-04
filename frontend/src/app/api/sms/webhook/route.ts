// Inbound SMS webhook. Twilio POSTs form-encoded data here when a text arrives
// at a workspace number. We verify the Twilio signature, route by the "To"
// number, handle STOP/START, and record the message.
import { NextResponse } from "next/server";
import {
  isStartKeyword,
  isStopKeyword,
  validateTwilioSignature,
} from "@/lib/twilio-server";
import {
  addContactActivityAdmin,
  findContactByPhone,
  findWorkspaceByNumber,
  markSmsOptOut,
  recordMessage,
} from "@/services/messaging-server";

export const runtime = "nodejs";

const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
const xml = (status = 200) =>
  new NextResponse(EMPTY_TWIML, {
    status,
    headers: { "Content-Type": "text/xml" },
  });

function publicUrl(request: Request, path: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
  }
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return `${proto}://${host}${path}`;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  const signature = request.headers.get("x-twilio-signature");
  const url = publicUrl(request, "/api/sms/webhook");
  if (!validateTwilioSignature(signature, url, params)) {
    return xml(403);
  }

  const from = params.From;
  const to = params.To;
  const messageBody = params.Body ?? "";
  const twilioSid = params.MessageSid ?? null;
  if (!from || !to) return xml();

  const workspace = await findWorkspaceByNumber(to);
  if (!workspace) return xml(); // number not attached to any workspace - ignore

  const contactId = await findContactByPhone(workspace.workspaceId, from);

  // STOP/START compliance handling (carrier also enforces this for Messaging
  // Services, but we mirror it so the CRM state is accurate).
  if (contactId && isStopKeyword(messageBody)) {
    await markSmsOptOut(workspace.workspaceId, contactId, true);
  } else if (contactId && isStartKeyword(messageBody)) {
    await markSmsOptOut(workspace.workspaceId, contactId, false);
  }

  try {
    await recordMessage({
      workspaceId: workspace.workspaceId,
      workspacePhone: workspace.phoneNumber,
      contactPhone: from,
      contactId,
      direction: "inbound",
      body: messageBody,
      status: "received",
      twilioSid,
    });
    if (contactId) {
      await addContactActivityAdmin({
        workspaceId: workspace.workspaceId,
        contactId,
        type: "sms",
        body: messageBody,
        direction: "inbound",
        createdBy: "system",
      });
    }
  } catch (err) {
    console.error("Failed to record inbound SMS:", err);
  }

  return xml();
}
