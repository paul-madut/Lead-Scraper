import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { AdminTokenService } from "@/services/adminTokenService";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  try {
    const balance = await AdminTokenService.getTokenBalance(auth.uid);
    return NextResponse.json({ success: true, balance });
  } catch (error) {
    console.error("Error getting token balance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get token balance" },
      { status: 500 }
    );
  }
}
