"use client";

import { useState, type KeyboardEvent } from "react";
import { Telescope, Loader2, StopCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/types";

interface InputAreaProps {
  onStart: (query: string) => void;
  onStop: () => void;
  status: AgentStatus;
}

export default function InputArea({ onStart, onStop, status }: InputAreaProps) {
  const [query, setQuery] = useState("");
  const isRunning = status === "running";
  const canSubmit = query.trim().length > 0 && !isRunning;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onStart(query.trim());
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <div className="relative w-full">
      {/* Glow halo — pulses when running */}
      <div
        className={cn(
          "absolute -inset-px rounded-xl transition-all duration-700",
          isRunning
            ? "bg-gradient-to-r from-indigo-500/30 via-emerald-500/20 to-indigo-500/30 blur-sm animate-pulse"
            : "bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10"
        )}
      />

      <div className="relative rounded-xl border border-white/10 bg-[#0f172a]/80 backdrop-blur-md overflow-hidden">
        {/* Top label bar */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          <Telescope className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.18em] text-indigo-400/80">
            Research Goal
          </span>
          {isRunning && (
            <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Agent running
            </span>
          )}
        </div>

        {/* Textarea */}
        <textarea
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          disabled={isRunning}
          placeholder="e.g. Analyze the competitive landscape of autonomous AI agents in 2025..."
          className={cn(
            "w-full resize-none bg-transparent px-4 py-2",
            "text-[15px] text-slate-100 placeholder:text-slate-600",
            "font-sans leading-relaxed tracking-[-0.01em]",
            "focus:outline-none disabled:opacity-60",
          )}
        />

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span className="text-[11px] text-slate-600 font-mono">
            {isRunning ? "Agent is working..." : "⌘ + Enter to run"}
          </span>

          <div className="flex items-center gap-2">
            {isRunning && (
              <button
                onClick={onStop}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border border-red-500/30",
                  "bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400",
                  "hover:bg-red-500/20 transition-colors duration-150"
                )}
              >
                <StopCircle className="h-3.5 w-3.5" />
                Stop
              </button>
            )}

            <button
              onClick={isRunning ? onStop : handleSubmit}
              disabled={!isRunning && !canSubmit}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold",
                "transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
                isRunning
                  ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.97]",
                !isRunning && canSubmit && "shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              )}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Telescope className="h-4 w-4" />
                  Initiate Research
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}