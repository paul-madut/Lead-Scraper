"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// Type-only imports are erased at build time, so they never pull the
// browser-only SDK into the server bundle.
import type { Call, Device } from "@twilio/voice-sdk";
import { useAuth } from "@/components/AuthProvider";
import type { CallOutcome } from "@/lib/types";

export type CallStatus = "idle" | "connecting" | "in-call" | "error";

export function useVoiceCall() {
  const { user } = useAuth();
  const deviceRef = useRef<Device | null>(null);
  const callRef = useRef<Call | null>(null);
  const acceptedRef = useRef(false);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef<{ to: string; contactId?: string } | null>(null);

  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [durationSec, setDurationSec] = useState(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const logOutcome = useCallback(
    async (outcome: CallOutcome) => {
      if (!user || !targetRef.current) return;
      const durationSecFinal = acceptedRef.current
        ? Math.round((Date.now() - startRef.current) / 1000)
        : 0;
      try {
        const token = await user.getIdToken();
        await fetch("/api/calls/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: targetRef.current.to,
            contactId: targetRef.current.contactId,
            outcome,
            durationSec: durationSecFinal,
          }),
        });
      } catch {
        // Logging is best-effort; never block call teardown.
      }
    },
    [user]
  );

  const teardown = useCallback(() => {
    clearTimer();
    callRef.current = null;
    deviceRef.current?.destroy();
    deviceRef.current = null;
    setMuted(false);
  }, []);

  const startCall = useCallback(
    async (to: string, contactId?: string) => {
      if (!user) return;
      setError(null);
      setStatus("connecting");
      setDurationSec(0);
      acceptedRef.current = false;
      targetRef.current = { to, contactId };

      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/voice/token", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Calling is unavailable");

        const { Device } = await import("@twilio/voice-sdk");
        const device = new Device(data.token);
        deviceRef.current = device;

        const call = await device.connect({ params: { To: to } });
        callRef.current = call;

        call.on("accept", () => {
          acceptedRef.current = true;
          startRef.current = Date.now();
          setStatus("in-call");
          timerRef.current = setInterval(
            () => setDurationSec(Math.round((Date.now() - startRef.current) / 1000)),
            1000
          );
        });
        call.on("disconnect", () => {
          logOutcome(acceptedRef.current ? "completed" : "no-answer");
          setStatus("idle");
          teardown();
        });
        call.on("cancel", () => {
          logOutcome("canceled");
          setStatus("idle");
          teardown();
        });
        call.on("error", (e: { message?: string }) => {
          setError(e?.message ?? "Call error");
          logOutcome("failed");
          setStatus("error");
          teardown();
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start the call");
        setStatus("error");
        teardown();
      }
    },
    [user, logOutcome, teardown]
  );

  const endCall = useCallback(() => {
    callRef.current?.disconnect();
  }, []);

  const toggleMute = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    const next = !muted;
    call.mute(next);
    setMuted(next);
  }, [muted]);

  useEffect(() => {
    return () => {
      callRef.current?.disconnect();
      teardown();
    };
  }, [teardown]);

  return { status, error, muted, durationSec, startCall, endCall, toggleMute };
}
