// lib/workspace-server.ts - server-side workspace provisioning.
// Every user gets a personal workspace on first access. Membership docs are
// created only here (never client-writable), which is what makes tenancy safe.
const getAdminDb = async () => {
  if (typeof window !== "undefined") {
    throw new Error("Admin services must only run on the server side");
  }
  const { adminDb } = await import("../lib/firebase-admin");
  return adminDb;
};

export interface WorkspaceInfo {
  workspaceId: string;
  name: string;
}

export async function ensureWorkspace(
  userId: string,
  displayName?: string
): Promise<WorkspaceInfo> {
  const adminDb = await getAdminDb();
  const userRef = adminDb.collection("users").doc(userId);
  const userSnap = await userRef.get();

  // Already provisioned.
  if (userSnap.exists && userSnap.data()?.defaultWorkspaceId) {
    const workspaceId = userSnap.data()!.defaultWorkspaceId as string;
    const wsSnap = await adminDb.collection("workspaces").doc(workspaceId).get();
    return {
      workspaceId,
      name: (wsSnap.data()?.name as string) ?? "My Workspace",
    };
  }

  // Provision a personal workspace + owner membership atomically.
  const workspaceRef = adminDb.collection("workspaces").doc();
  const workspaceId = workspaceRef.id;
  const name = displayName ? `${displayName}'s Workspace` : "My Workspace";
  const now = new Date();

  const batch = adminDb.batch();
  batch.set(workspaceRef, {
    name,
    ownerUserId: userId,
    createdAt: now,
  });
  batch.set(adminDb.collection("memberships").doc(`${workspaceId}__${userId}`), {
    workspaceId,
    userId,
    role: "owner",
    createdAt: now,
  });
  batch.set(userRef, { defaultWorkspaceId: workspaceId, updatedAt: now }, { merge: true });
  await batch.commit();

  return { workspaceId, name };
}
