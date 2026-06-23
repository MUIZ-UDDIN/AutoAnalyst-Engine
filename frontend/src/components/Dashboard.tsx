"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Cpu, Activity, Moon } from "lucide-react";
import InputArea from "./inputarea";
import ThoughtStream from "./Thoughtstream";
import ReportViewer from "./Reportview";
import ArtifactsSidebar from "./Artifactssidebar";
import { AgentWebSocket } from "@/services/AgentWeSocket";
import { generateId } from "@/lib/utils";
import type { AgentState, LogEntry, ResearchReport, WsMessage, Artifact } from "@/types";

const INITIAL_STATE: AgentState = {
  status: "idle",
  query: "",
  logs: [],
  report: null,
  artifacts: [],
  elapsedMs: 0,
};

// New artifacts get prepended here when a report completes
const SEED_ARTIFACTS: Artifact[] = [];

export default function Dashboard() {
  const [state, setState] = useState<AgentState>({
    ...INITIAL_STATE,
    artifacts: SEED_ARTIFACTS,
  });

  const wsRef = useRef<AgentWebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Tick the elapsed timer while running
  useEffect(() => {
    if (state.status === "running") {
      startTimeRef.current = Date.now() - state.elapsedMs;
      timerRef.current = setInterval(() => {
        setState((s) => ({ ...s, elapsedMs: Date.now() - startTimeRef.current }));
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.status, state.elapsedMs]);

const handleMessage = useCallback((msg: WsMessage) => {
  if (msg.type === "log") {
    setState((s) => ({
      ...s,
      logs: [...s.logs, msg.payload as LogEntry],
    }));
  } 
  
  else if (msg.type === "report") {
    const reportData = msg.payload as ResearchReport;
    
    const newArtifact: Artifact = {
      id: reportData.id,
      title: reportData.title,
      filename: reportData.filename,
      createdAt: reportData.createdAt,
      sizeKb: reportData.sizeKb || 0,
      downloadUrl: reportData.downloadUrl, // This fixes the HTML download bug
    };

    setState((s) => ({
      ...s,
      report: reportData,
      // LOGIC: Create the artifact HERE, using the real data and real URL
      artifacts: [newArtifact, ...s.artifacts],
    }));
  } 
  
  else if (msg.type === "complete") {
    // LOGIC: Only change the status. Do NOT add a new artifact here.
    setState((s) => ({ ...s, status: "complete" }));
  } 
  
  else if (msg.type === "error") {
    const errorPayload = msg.payload as { message: string };
    const errorLog: LogEntry = {
      id: generateId(),
      step: "error",
      message: errorPayload.message || "An unknown error occurred",
      timestamp: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      status: "error",
      logs: [...s.logs, errorLog],
    }));
  }
}, []);

  const handleStart = useCallback((query: string) => {
    // Cancel any running session
    wsRef.current?.disconnect();

    setState((s) => ({
      ...s,
      status: "running",
      query,
      logs: [],
      report: null,
      elapsedMs: 0,
    }));

    wsRef.current = new AgentWebSocket(
      query,
      handleMessage,
      () => {} // onClose — state is set via "complete" message
    );
  }, [handleMessage]);

  const handleStop = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    setState((s) => ({ ...s, status: "idle" }));
  }, []);

  const handleDeleteArtifact = useCallback(async (id: string) => {
    const target = state.artifacts.find(a => a.id === id);
  
    if (target?.filename) {
      try {
        // 2. Tell Python to delete the physical file
        await fetch(`http://localhost:8000/api/artifacts/${target.filename}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.error("Failed to delete from disk", e);
      }
    }

    setState((s) => ({
      ...s,
      artifacts: s.artifacts.filter((a) => a.id !== id),
    }));
  }, [state.artifacts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { wsRef.current?.disconnect(); };
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[#060a12] text-slate-100 overflow-hidden">
      {/* ── Nav bar ──────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-3 border-b border-white/[0.06] bg-[#060a12]/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-[0_0_12px_rgba(99,102,241,0.4)]">
            <Cpu className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-bold tracking-tight text-white">AutoAnalyst</span>
            <span className="text-[13px] font-normal text-indigo-400">Engine</span>
          </div>
        </div>

        {/* Status pill */}
        <div className="ml-4 flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1">
          <Activity className="h-3 w-3 text-slate-500" />
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
            {state.status === "running" ? (
              <span className="text-emerald-400">Agent Active</span>
            ) : state.status === "complete" ? (
              <span className="text-indigo-400">Report Ready</span>
            ) : (
              "Standby"
            )}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[11px] text-slate-700">v0.1.0-alpha</span>
          <div className="h-4 w-px bg-white/10" />
          <Moon className="h-4 w-4 text-slate-600" />
        </div>
      </nav>

      {/* ── Command Center ────────────────────────────────────────────── */}
      <div className="border-b border-white/[0.06] bg-gradient-to-b from-indigo-950/10 to-transparent px-6 py-4">
        <InputArea
          onStart={handleStart}
          onStop={handleStop}
          status={state.status}
        />
      </div>

      {/* ── 3-Column Layout ───────────────────────────────────────────── */}
      <div className="flex flex-1 gap-3 overflow-hidden p-4">
        {/* Col 1: Artifacts sidebar */}
        <div className="w-[220px] flex-shrink-0">
          <ArtifactsSidebar
            artifacts={state.artifacts}
            onDelete={handleDeleteArtifact}
          />
        </div>

        {/* Col 2: Thought Stream */}
        <div className="w-[300px] flex-shrink-0">
          <ThoughtStream
            logs={state.logs}
            status={state.status}
            elapsedMs={state.elapsedMs}
          />
        </div>

        {/* Col 3: Report Viewer — fills remaining space */}
        <div className="flex-1 min-w-0">
          <ReportViewer
            report={state.report}
            status={state.status}
          />
        </div>
      </div>
    </div>
  );
}