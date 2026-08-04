"use client";

import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceCall } from "@/hooks/useVoiceCall";

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Click-to-call button + in-call panel for a contact. */
export default function ContactCallButton({
  phone,
  contactId,
  onCallEnded,
}: {
  phone: string;
  contactId?: string;
  onCallEnded?: () => void;
}) {
  const { status, error, muted, durationSec, startCall, endCall, toggleMute } =
    useVoiceCall();

  const active = status === "connecting" || status === "in-call";

  const handleStart = async () => {
    await startCall(phone, contactId);
  };

  const handleEnd = () => {
    endCall();
    onCallEnded?.();
  };

  if (active) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
        </span>
        <span className="text-sm font-medium">
          {status === "connecting" ? "Connecting..." : formatDuration(durationSec)}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Button variant="destructive" size="icon" onClick={handleEnd} aria-label="Hang up">
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleStart}>
        <Phone className="h-4 w-4" />
        Call
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
