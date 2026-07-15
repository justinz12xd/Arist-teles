"use client";

import { Loader2, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type VoiceStatus = "idle" | "recording" | "transcribing";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  onTranscript?: (text: string) => void;
  onError?: (message: string) => void;
  onUnsupported?: () => void;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  maxDuration?: number;
  transcriptionEndpoint?: string;
  className?: string;
  compact?: boolean;
  showStatus?: boolean;
}

const AUDIO_TYPES = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/webm",
  "audio/ogg;codecs=opus",
];

function supportedAudioType() {
  if (typeof MediaRecorder === "undefined") return "";
  return AUDIO_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function audioExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("wav")) return "wav";
  return "webm";
}

export function AIVoiceInput({
  onStart,
  onStop,
  onTranscript,
  onError,
  onUnsupported,
  visualizerBars = 48,
  demoMode = false,
  demoInterval = 3000,
  maxDuration = 120,
  transcriptionEndpoint = "/api/transcribe",
  className,
  compact = false,
  showStatus = true,
}: AIVoiceInputProps) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDemo, setIsDemo] = useState(demoMode);
  const [demoRecording, setDemoRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const maxDurationTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const isRecording = status === "recording" || demoRecording;
  const isTranscribing = status === "transcribing";

  useEffect(() => {
    setIsClient(true);
    return () => {
      mountedRef.current = false;
      if (maxDurationTimerRef.current !== null) {
        window.clearTimeout(maxDurationTimerRef.current);
      }
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (status !== "recording") return;
    const intervalId = window.setInterval(() => {
      setTime(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
    return () => window.clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    if (!isDemo) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const runAnimation = () => {
      setDemoRecording(true);
      timeoutId = setTimeout(() => {
        setDemoRecording(false);
        timeoutId = setTimeout(runAnimation, 1000);
      }, demoInterval);
    };

    const initialTimeout = setTimeout(runAnimation, 100);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, [isDemo, demoInterval]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const transcribe = async (audio: Blob) => {
    if (!mountedRef.current) return;
    setStatus("transcribing");

    const mimeType = audio.type || "audio/webm";
    const formData = new FormData();
    formData.set(
      "file",
      new File([audio], `recording.${audioExtension(mimeType)}`, { type: mimeType }),
    );
    formData.set("language", "es");

    try {
      const response = await fetch(transcriptionEndpoint, {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        text?: string;
        error?: string;
        detail?: string;
      };
      if (!response.ok || !payload.text?.trim()) {
        throw new Error(payload.detail ?? payload.error ?? "Transcription failed");
      }
      onTranscript?.(payload.text.trim());
    } catch {
      onError?.("No pude transcribir el audio. Verifica Whisper y vuelve a intentarlo.");
    } finally {
      if (mountedRef.current) {
        setStatus("idle");
        setTime(0);
      }
    }
  };

  const stopRecording = () => {
    if (maxDurationTimerRef.current !== null) {
      window.clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const startRecording = async () => {
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      onUnsupported?.();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = supportedAudioType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        stopStream();
        if (mountedRef.current) {
          setStatus("idle");
          setTime(0);
          onError?.("El navegador no pudo grabar el micrófono.");
        }
      };
      recorder.onstop = () => {
        const duration = Math.max(
          0,
          Math.round((Date.now() - startedAtRef.current) / 1000),
        );
        const audio = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || "audio/webm",
        });
        recorderRef.current = null;
        chunksRef.current = [];
        stopStream();
        onStop?.(duration);
        if (!audio.size) {
          if (mountedRef.current) {
            setStatus("idle");
            setTime(0);
            onError?.("No se detectó audio en la grabación.");
          }
          return;
        }
        void transcribe(audio);
      };

      startedAtRef.current = Date.now();
      recorder.start(250);
      setStatus("recording");
      setTime(0);
      onStart?.();
      maxDurationTimerRef.current = window.setTimeout(stopRecording, maxDuration * 1000);
    } catch {
      stopStream();
      setStatus("idle");
      onError?.("No pude acceder al micrófono. Revisa los permisos del navegador.");
    }
  };

  const handleClick = () => {
    if (isDemo) {
      setIsDemo(false);
      setDemoRecording(false);
      return;
    }
    if (status === "recording") {
      stopRecording();
      return;
    }
    if (status === "idle") {
      void startRecording();
    }
  };

  if (compact) {
    return (
      <button
        className={cn(
          "group flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-cyan)]",
          isRecording
            ? "bg-[rgb(216_177_95/0.18)] text-[var(--accent-cyan)]"
            : "text-[var(--primary-60)] hover:bg-white/10 hover:text-white",
          className,
        )}
        type="button"
        onClick={handleClick}
        disabled={isTranscribing}
        aria-label={
          isTranscribing
            ? "Transcribiendo audio"
            : isRecording
              ? `Detener grabación, ${formatTime(time)}`
              : "Grabar audio con Whisper"
        }
        title={
          isTranscribing
            ? "Whisper está transcribiendo"
            : isRecording
              ? `Grabando ${formatTime(time)}`
              : "Dictar con Whisper"
        }
      >
        {isTranscribing ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
        ) : isRecording ? (
          <span className="h-3.5 w-3.5 animate-pulse rounded-[0.2rem] bg-[var(--accent-cyan)]" />
        ) : (
          <Mic className="h-[18px] w-[18px]" />
        )}
      </button>
    );
  }

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative mx-auto flex w-full max-w-xl flex-col items-center gap-2">
        <button
          className={cn(
            "group flex h-16 w-16 items-center justify-center rounded-xl transition-colors",
            isRecording ? "bg-none" : "bg-none hover:bg-black/10 dark:hover:bg-white/10",
          )}
          type="button"
          onClick={handleClick}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <Loader2 className="h-6 w-6 animate-spin text-black/70 dark:text-white/70" />
          ) : isRecording ? (
            <span className="h-6 w-6 animate-pulse rounded-sm bg-black dark:bg-white" />
          ) : (
            <Mic className="h-6 w-6 text-black/70 dark:text-white/70" />
          )}
        </button>

        {showStatus && (
          <>
            <span
              className={cn(
                "font-mono text-sm transition-opacity duration-300",
                isRecording || isTranscribing
                  ? "text-black/70 dark:text-white/70"
                  : "text-black/30 dark:text-white/30",
              )}
            >
              {formatTime(time)}
            </span>

            <div className="flex h-4 w-64 items-center justify-center gap-0.5">
              {[...Array(visualizerBars)].map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-0.5 rounded-full transition-[height,background-color] duration-300",
                    isRecording
                      ? "animate-pulse bg-black/50 dark:bg-white/50"
                      : "h-1 bg-black/10 dark:bg-white/10",
                  )}
                  style={
                    isRecording && isClient
                      ? {
                          height: `${20 + Math.random() * 80}%`,
                          animationDelay: `${index * 0.05}s`,
                        }
                      : undefined
                  }
                />
              ))}
            </div>

            <p className="h-4 text-xs text-black/70 dark:text-white/70">
              {isTranscribing
                ? "Transcribiendo con Whisper..."
                : isRecording
                  ? "Escuchando..."
                  : "Haz clic para hablar"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
