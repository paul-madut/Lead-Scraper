"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";

interface WorkspaceContextValue {
  workspaceId: string | null;
  workspaceName: string | null;
  loading: boolean;
  error: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceId: null,
  workspaceName: null,
  loading: true,
  error: null,
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<WorkspaceContextValue>({
    workspaceId: null,
    workspaceName: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let ignore = false;
    if (authLoading) return;
    if (!user) {
      setState({ workspaceId: null, workspaceName: null, loading: false, error: null });
      return;
    }

    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/workspace/bootstrap", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ displayName: user.displayName ?? undefined }),
        });
        const data = await res.json();
        if (ignore) return;
        if (!res.ok || !data.success) throw new Error(data.error || "Failed");
        setState({
          workspaceId: data.workspaceId,
          workspaceName: data.name,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (ignore) return;
        setState({
          workspaceId: null,
          workspaceName: null,
          loading: false,
          error: err instanceof Error ? err.message : "Failed to load workspace",
        });
      }
    })();

    return () => {
      ignore = true;
    };
  }, [user, authLoading]);

  return (
    <WorkspaceContext.Provider value={state}>{children}</WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);
