// ─── AutoAnalyst-Engine · Type Definitions ───────────────────────────────────

export type LogStep =
  | "search"
  | "analyze"
  | "reason"
  | "save"
  | "fetch"
  | "synthesize"
  | "complete"
  | "error";

export interface LogEntry {
  id: string;
  step: LogStep;
  message: string;
  timestamp: string; // ISO string
  duration?: number; // ms, optional — filled when step completes
}

export interface ResearchReport {
  id: string;
  title: string;
  markdown: string;
  createdAt: string; // ISO string
  wordCount: number;
  sources: string[];
  filename?: string;    
  sizeKb?: number;      
  downloadUrl: string;
}

export interface Artifact {
  id: string;
  filename: string;
  title: string;
  createdAt: string;
  sizeKb: number;
  downloadUrl: string; // real FastAPI endpoint later
}

export type AgentStatus =
  | "idle"
  | "running"
  | "complete"
  | "error";

export interface AgentState {
  status: AgentStatus;
  query: string;
  logs: LogEntry[];
  report: ResearchReport | null;
  artifacts: Artifact[];
  elapsedMs: number;
}

// WebSocket message shape from FastAPI backend
export interface WsMessage {
  type: "log" | "report" | "complete" | "error";
  payload: LogEntry | ResearchReport | { message: string };
}