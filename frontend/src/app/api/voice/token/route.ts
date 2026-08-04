import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { generateVoiceToken, isVoiceConfigured } from "@/lib/twilio-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  if (!isVoiceConfigured()) {
    return NextResponse.json(
      { error: "Calling is not configured yet." },
      { status: 503 }
    );
  }

  // The client identity is the user id, so the TwiML route can resolve their
  // workspace (and therefore the correct caller ID) without trusting the client.
  const token = generateVoiceToken(auth.uid);
  return NextResponse.json({ success: true, token, identity: auth.uid });
}
