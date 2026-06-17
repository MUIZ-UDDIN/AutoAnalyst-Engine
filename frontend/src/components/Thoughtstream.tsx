"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import type { LogEntry, LogStep, AgentStatus } from "@/types";
import {
  Search,
  Globe,
  Brain,
  Lightbulb,
  FileText,
  Save,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";

interface ThoughtStreamProps {
  logs: LogEntry[];
  status: AgentStatus;
  elapsedMs: number;
}

// ── Icon + color map per step type ──────────────────────────────────────────
const STEP_CONFIG: Record<
  LogStep,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  search:     { icon: Search,       color: "text-indigo-400", bg: "bg-indigo-500/10",  label: "SEARCH"     },
  fetch:      { icon: Globe,        color: "text-sky-400",    bg: "bg-sky-500/10",     label: "FETCH"      },
  analyze:    { icon: Brain,        color: "text-violet-400", bg: "bg-violet-500/10",  label: "ANALYZE"    },
  reason:     { icon: Lightbulb,    color: "text-amber-400",  bg: "bg-amber-500/10",   label: "REASON"     },
  synthesize: { icon: FileText,     color: "text-emerald-400",bg: "bg-emerald-500/10", label: "SYNTHESIZE" },
  save:       { icon: Save,         color: "text-teal-400",   bg: "bg-teal-500/10",    label: "SAVE"       },
  complete:   { icon: CheckCircle2, color: "text-emerald-400",bg: "bg-emerald-500/10", label: "COMPLETE"   },
  error:      { icon: XCircle,      color: "text-red-400",    bg: "bg-red-500/10",     label: "ERROR"      },
};

function LogRow({ entry, isLatest }: { entry: LogEntry; isLatest: boolean }) {
  const cfg = STEP_CONFIG[entry.step];
  const Icon = cfg.icon;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200",
        isLatest ? "bg-white/[0.04]" : "hover:bg-white/[0.02]"
      )}
    >
      {/* Step icon badge */}
      <div className={cn("mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md", cfg.bg)}>
        <Icon className={cn("h-3.5 w-3.5", cfg.color)} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("text-[10px] font-mono font-bold tracking-[0.12em]", cfg.color)}>
            {cfg.label}
          </span>
          <span className="text-[10px] font-mono text-slate-600">
            {formatTimestamp(entry.timestamp)}
          </span>
          {isLatest && (
            <span className="ml-auto text-[10px] font-mono text-emerald-500 flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              live
            </span>
          )}
        </div>
        <p className="font-mono text-[12.5px] leading-relaxed text-slate-300">
          {entry.message}
          {isLatest && (
            <span className="ml-0.5 inline-block h-3 w-[7px] bg-indigo-400/80 align-middle animate-[blink_1s_step-end_infinite]" />
          )}
        </p>
      </div>
    </div>
  );
}

export default function ThoughtStream({ logs, status, elapsedMs }: ThoughtStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new logs arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const isRunning = status === "running";
  const isComplete = status === "complete";
  const isEmpty = logs.length === 0;

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-[#080c14]/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <span className="text-[11px] font-mono font-medium uppercase tracking-[0.18em] text-slate-500 ml-1">
          Thought Stream
        </span>
        {isRunning && (
          <div className="ml-auto flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-indigo-400 animate-pulse" />
            <span className="font-mono text-[10px] text-indigo-400">
              {(elapsedMs / 1000).toFixed(1)}s
            </span>
          </div>
        )}
        {isComplete && (
          <div className="ml-auto">
            <span className="font-mono text-[10px] text-emerald-400">
              ✓ {(elapsedMs / 1000).toFixed(1)}s total
            </span>
          </div>
        )}
      </div>

      {/* Log feed */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#1e293b transparent",
        }}
      >
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/60 border border-white/5">
              <Brain className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-center font-mono text-xs text-slate-600 leading-relaxed max-w-[160px]">
              Agent reasoning will<br />appear here in real-time
            </p>
          </div>
        ) : (
          logs.map((entry, i) => (
            <LogRow
              key={entry.id}
              entry={entry}
              isLatest={i === logs.length - 1 && isRunning}
            />
          ))
        )}
      </div>

      {/* Footer status bar */}
      <div className="border-t border-white/[0.06] px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate-600">
            {logs.length} steps logged
          </span>
          <div
            className={cn(
              "flex items-center gap-1.5 font-mono text-[10px] font-medium",
              isRunning ? "text-emerald-400" : isComplete ? "text-emerald-500" : "text-slate-600"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isRunning ? "bg-emerald-400 animate-pulse" : isComplete ? "bg-emerald-500" : "bg-slate-600"
              )}
            />
            {isRunning ? "RUNNING" : isComplete ? "COMPLETE" : status === "error" ? "ERROR" : "IDLE"}
          </div>
        </div>
      </div>
    </div>
  );
}