"use client";

import { Mic } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  className?: string;
  compact?: boolean;
  showStatus?: boolean;
}

export function AIVoiceInput({
  onStart,
  onStop,
  visualizerBars = 48,
  demoMode = false,
  demoInterval = 3000,
  className,
  compact = false,
  showStatus = true,
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDemo, setIsDemo] = useState(demoMode);
  const previousSubmitted = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!submitted) return;

    onStart?.();
    const intervalId = setInterval(() => {
      setTime((t) => t + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [submitted, onStart]);

  useEffect(() => {
    if (previousSubmitted.current && !submitted) {
      onStop?.(time);
      setTime(0);
    }
    previousSubmitted.current = submitted;
  }, [submitted, time, onStop]);

  useEffect(() => {
    if (!isDemo) return;

    let timeoutId: NodeJS.Timeout;
    const runAnimation = () => {
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
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

  const handleClick = () => {
    if (isDemo) {
      setIsDemo(false);
      setSubmitted(false);
    } else {
      setSubmitted((prev) => !prev);
    }
  };

  if (compact) {
    return (
      <button
        className={cn(
          "group flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
          submitted
            ? "bg-[rgb(216_177_95/0.18)] text-[var(--accent-cyan)]"
            : "text-[var(--primary-60)] hover:bg-white/10 hover:text-white",
          className
        )}
        type="button"
        onClick={handleClick}
        aria-label={submitted ? `Detener grabación, ${formatTime(time)}` : "Iniciar dictado por voz"}
        title={submitted ? `Grabando ${formatTime(time)}` : "Dictar con voz"}
      >
        {submitted ? (
          <div
            className="h-3.5 w-3.5 cursor-pointer rounded-[0.2rem] bg-[var(--accent-cyan)] animate-spin pointer-events-auto"
            style={{ animationDuration: "3s" }}
          />
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
            submitted ? "bg-none" : "bg-none hover:bg-black/10 dark:hover:bg-white/10"
          )}
          type="button"
          onClick={handleClick}
        >
          {submitted ? (
            <div
              className="h-6 w-6 cursor-pointer rounded-sm bg-black animate-spin pointer-events-auto dark:bg-white"
              style={{ animationDuration: "3s" }}
            />
          ) : (
            <Mic className="h-6 w-6 text-black/70 dark:text-white/70" />
          )}
        </button>

        {showStatus && (
          <>
            <span
              className={cn(
                "font-mono text-sm transition-opacity duration-300",
                submitted ? "text-black/70 dark:text-white/70" : "text-black/30 dark:text-white/30"
              )}
            >
              {formatTime(time)}
            </span>

            <div className="flex h-4 w-64 items-center justify-center gap-0.5">
              {[...Array(visualizerBars)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-0.5 rounded-full transition-all duration-300",
                    submitted ? "animate-pulse bg-black/50 dark:bg-white/50" : "h-1 bg-black/10 dark:bg-white/10"
                  )}
                  style={
                    submitted && isClient
                      ? {
                          height: `${20 + Math.random() * 80}%`,
                          animationDelay: `${i * 0.05}s`,
                        }
                      : undefined
                  }
                />
              ))}
            </div>

            <p className="h-4 text-xs text-black/70 dark:text-white/70">
              {submitted ? "Listening..." : "Click to speak"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
