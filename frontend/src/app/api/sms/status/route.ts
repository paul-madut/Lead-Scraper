// Twilio delivery status callback for outbound messages.
import { NextResponse } from "next/server";
import { validateTwilioSignature } from "@/lib/twilio-server";
import { updateMessageStatusBySid } from "@/services/messaging-server";
import type { MessageStatus } from "@/lib/types";

export const runtime = "nodejs";

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
  const url = publicUrl(request, "/api/sms/status");
  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse("forbidden", { status: 403 });
  }

  const sid = params.MessageSid;
  const status = params.MessageStatus as MessageStatus | undefined;
  if (sid && status) {
    await updateMessageStatusBySid(sid, status, params.ErrorMessage);
  }
  return new NextResponse("", { status: 204 });
}
