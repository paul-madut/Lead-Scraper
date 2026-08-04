// lib/auth-server.ts - single place that turns a request's Bearer token into a
// verified uid. Server-only.
import { NextResponse } from "next/server";

export type AuthResult =
  | { ok: true; uid: string }
  | { ok: false; response: NextResponse };

export async function requireUser(request: Request): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  const idToken = authHeader.slice("Bearer ".length);
  try {
    const { adminAuth } = await import("@/lib/firebase-admin");
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { ok: true, uid: decoded.uid };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or expired authentication token" },
        { status: 401 }
      ),
    };
  }
}
