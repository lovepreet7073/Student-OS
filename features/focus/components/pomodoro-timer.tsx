"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Coffee, Pause, Play, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = "focus" | "break";

interface Config {
  focusMinutes: number;
  breakMinutes: number;
}

const DEFAULT_CONFIG: Config = { focusMinutes: 25, breakMinutes: 5 };
const CONFIG_KEY = "studyos:pomodoro:config";

// Circle progress ring: 260px diameter, 6px stroke, ~797 circumference.
const RADIUS = 130;
const STROKE = 6;
const CIRCUMFERENCE = 2 * Math.PI * (RADIUS - STROKE);

/**
 * Classic Pomodoro timer. 25-minute focus / 5-minute break by default; the
 * student can adjust both between rounds. State lives in memory + localStorage
 * (config only) — the timer itself resets on refresh, which is the correct
 * behaviour: a Pomodoro is a commitment to focus for one continuous session.
 *
 * Design intent: giant circular ring + big minutes number is the whole
 * screen. No distractions. Play / pause / reset are the only controls.
 */
export function PomodoroTimer() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [phase, setPhase] = useState<Phase>("focus");
  const [remaining, setRemaining] = useState(DEFAULT_CONFIG.focusMinutes * 60);
  const [running, setRunning] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load saved config from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Config;
        if (
          typeof parsed.focusMinutes === "number" &&
          typeof parsed.breakMinutes === "number" &&
          parsed.focusMinutes > 0 &&
          parsed.breakMinutes > 0
        ) {
          setConfig(parsed);
          setRemaining(parsed.focusMinutes * 60);
        }
      }
    } catch {
      // ignore parse errors — fall back to defaults
    }
  }, []);

  const totalSeconds = (phase === "focus" ? config.focusMinutes : config.breakMinutes) * 60;
  const progress = 1 - remaining / totalSeconds;

  // Timer tick.
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // Phase complete — auto-flip and keep running.
          if (phase === "focus") {
            setCompletedRounds((n) => n + 1);
            setPhase("break");
            return config.breakMinutes * 60;
          }
          setPhase("focus");
          return config.focusMinutes * 60;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, config.focusMinutes, config.breakMinutes]);

  // When timing out, browser tab title reflects the countdown.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (running) {
      const mm = Math.floor(remaining / 60);
      const ss = remaining % 60;
      document.title = `${mm.toString().padStart(2, "0")}:${ss
        .toString()
        .padStart(2, "0")} · ${phase === "focus" ? "Focus" : "Break"} · StudyOS`;
    } else {
      document.title = "Focus · StudyOS";
    }
    return () => {
      document.title = "Focus · StudyOS";
    };
  }, [running, remaining, phase]);

  const reset = useCallback(() => {
    setRunning(false);
    setPhase("focus");
    setRemaining(config.focusMinutes * 60);
  }, [config.focusMinutes]);

  const skipPhase = useCallback(() => {
    if (phase === "focus") {
      setCompletedRounds((n) => n + 1);
      setPhase("break");
      setRemaining(config.breakMinutes * 60);
    } else {
      setPhase("focus");
      setRemaining(config.focusMinutes * 60);
    }
  }, [phase, config.breakMinutes, config.focusMinutes]);

  function updateConfig(next: Config) {
    setConfig(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    }
    // If not running, snap remaining to the new phase length.
    if (!running) {
      setRemaining((phase === "focus" ? next.focusMinutes : next.breakMinutes) * 60);
    }
  }

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const strokeOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
        {phase === "focus" ? (
          <>
            <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={2.4} aria-hidden />
            Focus
          </>
        ) : (
          <>
            <Coffee className="h-3.5 w-3.5 text-warning" strokeWidth={2.4} aria-hidden />
            Break
          </>
        )}
        <span className="text-muted-foreground/60">·</span>
        <span>Round {completedRounds + 1}</span>
      </div>

      <div className="relative flex items-center justify-center">
        <svg
          width={RADIUS * 2}
          height={RADIUS * 2}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={RADIUS}
            cy={RADIUS}
            r={RADIUS - STROKE}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth={STROKE}
          />
          <circle
            cx={RADIUS}
            cy={RADIUS}
            r={RADIUS - STROKE}
            fill="none"
            stroke={phase === "focus" ? "hsl(var(--primary))" : "hsl(var(--warning))"}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <div className="text-[64px] font-extrabold tracking-tight tabular-nums sm:text-[72px]">
            {mm.toString().padStart(2, "0")}:{ss.toString().padStart(2, "0")}
          </div>
          <div className="text-[13px] font-semibold text-muted-foreground">
            {running ? "Running" : remaining === totalSeconds ? "Ready" : "Paused"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={reset}
          disabled={remaining === totalSeconds && !running && phase === "focus"}
          aria-label="Reset"
        >
          <RotateCcw className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={() => setRunning((r) => !r)}
          className="h-14 w-14 rounded-full p-0"
          aria-label={running ? "Pause" : "Start"}
        >
          {running ? (
            <Pause className="h-6 w-6" strokeWidth={2} aria-hidden />
          ) : (
            <Play className="ml-0.5 h-6 w-6" strokeWidth={2} aria-hidden />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={skipPhase}
          aria-label={phase === "focus" ? "Skip to break" : "Skip to focus"}
        >
          {phase === "focus" ? (
            <Coffee className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          ) : (
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
          )}
        </Button>
      </div>

      <ConfigRow config={config} onChange={updateConfig} disabled={running} />
    </div>
  );
}

function ConfigRow({
  config,
  onChange,
  disabled,
}: {
  config: Config;
  onChange: (next: Config) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-6 rounded-xl border border-border bg-card p-4">
      <NumberField
        label="Focus"
        value={config.focusMinutes}
        min={5}
        max={90}
        step={5}
        disabled={disabled}
        onChange={(v) => onChange({ ...config, focusMinutes: v })}
      />
      <div className="h-8 w-px bg-border" aria-hidden />
      <NumberField
        label="Break"
        value={config.breakMinutes}
        min={1}
        max={30}
        step={1}
        disabled={disabled}
        onChange={(v) => onChange({ ...config, breakMinutes: v })}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <div className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={disabled || value <= min}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-border text-lg font-bold transition-colors",
            "hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={`Decrease ${label.toLowerCase()}`}
        >
          −
        </button>
        <span className="min-w-[3.5rem] text-center text-[18px] font-extrabold tabular-nums">
          {value}m
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={disabled || value >= max}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border border-border text-lg font-bold transition-colors",
            "hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={`Increase ${label.toLowerCase()}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
