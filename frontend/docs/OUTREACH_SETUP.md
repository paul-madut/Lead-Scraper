# B2Lead outreach setup (SMS, calling, sequences)

The CRM + outreach features are built and will run as soon as the environment
is configured. Everything degrades gracefully until then: pages load, and SMS /
calling simply report "not configured" instead of crashing.

## 1. Firebase (required for everything)

Set the `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_*` (admin) vars from
`.env.example`. Then deploy the security rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

The indexes back the contact, conversation, call, and enrollment queries -
without them those pages throw "needs index" at runtime.

## 2. Twilio - SMS

1. Create a Twilio account and buy a phone number.
2. Create a **Messaging Service** (required for A2P 10DLC) and add your number
   to it. Start **10DLC brand + campaign registration now** - carrier approval
   takes ~1-3 weeks and no SMS sends until it clears.
3. Set env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
   `TWILIO_MESSAGING_SERVICE_SID` (or `TWILIO_PHONE_NUMBER`), and
   `NEXT_PUBLIC_APP_URL` (your deployed origin, e.g. `https://app.b2lead.com`).
4. In the Twilio number/Messaging Service settings, point the **inbound
   webhook** at `POST {APP_URL}/api/sms/webhook` and the **status callback** at
   `{APP_URL}/api/sms/status`.
5. In the app, open **Inbox** and attach your number (E.164). Inbound texts to
   it now route to your workspace.

STOP/START opt-out is handled automatically and reflected on the contact.

## 3. Twilio - browser calling

1. Create an **API Key + Secret** (Console → Account → API keys).
2. Create a **TwiML App**; set its **Voice Request URL** to
   `POST {APP_URL}/api/voice/twiml`.
3. Set env vars: `TWILIO_API_KEY`, `TWILIO_API_SECRET`, `TWILIO_TWIML_APP_SID`.

The caller ID is resolved server-side from your workspace's attached number, so
clients can't spoof it. Recording is off by default (two-party-consent safe).

## 4. Sequences (automation) cron

The sequence engine advances enrollments on a schedule.

1. Set `CRON_SECRET` in the Vercel project (any random string).
2. `vercel.json` already declares a cron hitting `/api/flows/tick` every 2
   minutes. Vercel sends `CRON_SECRET` as a Bearer token automatically.

Note: frequent crons need a Vercel **Pro** plan (Hobby is limited). On Hobby,
lower the frequency in `vercel.json` or trigger `/api/flows/tick` from an
external scheduler with the `Authorization: Bearer <CRON_SECRET>` header.

## Compliance checklist (do not skip)

- **SMS/calls to scraped numbers are cold contacts** - TCPA applies. Track
  consent (the contact model has `smsConsent` / `callConsent` / `optOutSms` /
  `dncCall`), honor STOP, and scrub DNC before outreach.
- Keep call recording off in two-party-consent states unless you have consent.
- Add your business's physical address + an opt-out path to any email later.
