// TwiML for outbound browser calls. Twilio hits this when a Voice SDK client
// places a call. We resolve the caller ID from the CALLING user's workspace
// (parsed from the client identity), so a client can never spoof caller ID.
import { NextResponse } from "next/server";
import twilio from "twilio";
import { validateTwilioSignature } from "@/lib/twilio-server";
import { ensureWorkspace } from "@/lib/workspace-server";
import { getWorkspacePrimaryNumber } from "@/services/messaging-server";

export const runtime = "nodejs";

function publicUrl(request: Request, path: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return `${proto}://${host}${path}`;
}

const xml = (body: string, status = 200) =>
  new NextResponse(body, { status, headers: { "Content-Type": "text/xml" } });

export async function POST(request: Request) {
  const form = await request.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  const signature = request.headers.get("x-twilio-signature");
  if (!validateTwilioSignature(signature, publicUrl(request, "/api/voice/twiml"), params)) {
    return xml("<Response><Reject/></Response>", 403);
  }

  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  const to = params.To;
  // Identity arrives as "client:<uid>".
  const identity = (params.From || params.Caller || "").replace(/^client:/, "");

  if (!to || !identity) {
    twiml.say("Sorry, this call could not be completed.");
    return xml(twiml.toString());
  }

  const { workspaceId } = await ensureWorkspace(identity);
  const callerId = await getWorkspacePrimaryNumber(workspaceId);
  if (!callerId) {
    twiml.say("No caller ID is set up for your workspace.");
    return xml(twiml.toString());
  }

  // record: do-not-record by default (two-party-consent safe).
  const dial = twiml.dial({ callerId, answerOnBridge: true, record: "do-not-record" });
  dial.number(to);
  return xml(twiml.toString());
}
