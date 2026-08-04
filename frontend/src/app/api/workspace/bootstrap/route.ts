import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { ensureWorkspace } from "@/lib/workspace-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  try {
    let displayName: string | undefined;
    try {
      const body = await request.json();
      if (typeof body?.displayName === "string") displayName = body.displayName;
    } catch {
      // no body is fine
    }
    const info = await ensureWorkspace(auth.uid, displayName);
    return NextResponse.json({ success: true, ...info });
  } catch (error) {
    console.error("Workspace bootstrap failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load workspace" },
      { status: 500 }
    );
  }
}
