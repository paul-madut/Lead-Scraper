// lib/twilio-server.ts - server-only Twilio helpers. SMS/voice are disabled
// (no-ops that report unconfigured) until the env vars are set, so the app
// builds and runs before Twilio is wired up.
import twilio from "twilio";

export function isTwilioConfigured(): boolean {
  // Either a scoped API key (preferred) or the master Auth Token authenticates
  // the REST client; a Messaging Service or a from-number is the sender.
  const hasCreds = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      ((process.env.TWILIO_API_KEY && process.env.TWILIO_API_SECRET) ||
        process.env.TWILIO_AUTH_TOKEN)
  );
  const hasSender = Boolean(
    process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_PHONE_NUMBER
  );
  return hasCreds && hasSender;
}

export function isVoiceConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_API_KEY &&
      process.env.TWILIO_API_SECRET &&
      process.env.TWILIO_TWIML_APP_SID
  );
}

/** Mint a browser Voice access token for a given client identity. */
export function generateVoiceToken(identity: string): string {
  const { AccessToken } = twilio.jwt;
  const VoiceGrant = AccessToken.VoiceGrant;

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity, ttl: 3600 }
  );
  token.addGrant(
    new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID!,
      incomingAllow: false,
    })
  );
  return token.toJwt();
}

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid) throw new Error("Twilio is not configured");
  // Prefer a scoped, revocable API key over the master Auth Token.
  if (apiKey && apiSecret) {
    return twilio(apiKey, apiSecret, { accountSid });
  }
  if (authToken) {
    return twilio(accountSid, authToken);
  }
  throw new Error("Twilio is not configured");
}

export interface SentSms {
  sid: string;
  status: string;
}

export async function sendSms(params: {
  to: string;
  body: string;
  statusCallback?: string;
}): Promise<SentSms> {
  const client = getTwilioClient();
  const base: {
    to: string;
    body: string;
    statusCallback?: string;
    messagingServiceSid?: string;
    from?: string;
  } = { to: params.to, body: params.body };

  if (params.statusCallback) base.statusCallback = params.statusCallback;
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    base.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  } else {
    base.from = process.env.TWILIO_PHONE_NUMBER;
  }

  const msg = await client.messages.create(base);
  return { sid: msg.sid, status: msg.status };
}

/**
 * Validate that a webhook request genuinely came from Twilio. `url` must be the
 * exact public URL Twilio was configured to call (built from NEXT_PUBLIC_APP_URL).
 */
export function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !signature) return false;
  return twilio.validateRequest(token, signature, url, params);
}

const STOP_KEYWORDS = new Set([
  "stop",
  "stopall",
  "unsubscribe",
  "cancel",
  "end",
  "quit",
]);
const START_KEYWORDS = new Set(["start", "unstop", "yes"]);

export function isStopKeyword(body: string): boolean {
  return STOP_KEYWORDS.has(body.trim().toLowerCase());
}

export function isStartKeyword(body: string): boolean {
  return START_KEYWORDS.has(body.trim().toLowerCase());
}
