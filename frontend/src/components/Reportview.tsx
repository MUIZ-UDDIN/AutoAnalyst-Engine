"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileText, Download, Copy, CheckCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResearchReport, AgentStatus } from "@/types";

interface ReportViewerProps {
  report: ResearchReport | null;
  status: AgentStatus;
}

export default function ReportViewer({ report, status }: ReportViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([report.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.slice(0, 40).replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isRunning = status === "running";

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-[#0a0f1e]/70 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3">
        <FileText className="h-4 w-4 text-indigo-400" />
        <span className="text-[11px] font-mono font-medium uppercase tracking-[0.18em] text-slate-500">
          Research Report
        </span>
        {report && (
          <span className="ml-2 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
            {report.wordCount.toLocaleString()} words
          </span>
        )}
        {report && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all duration-150"
            >
              {copied
                ? <><CheckCheck className="h-3.5 w-3.5 text-emerald-400" />Copied</>
                : <><Copy className="h-3.5 w-3.5" />Copy</>
              }
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600/90 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-indigo-500 transition-all duration-150"
            >
              <Download className="h-3.5 w-3.5" />
              Export .md
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto px-6 py-6"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#1e293b transparent" }}
      >
        {/* Loading skeleton */}
        {isRunning && !report && (
          <div className="space-y-4 animate-pulse">
            <div className="h-7 w-2/3 rounded-lg bg-slate-800/60" />
            <div className="h-3 w-1/3 rounded bg-slate-800/40" />
            <div className="mt-6 space-y-2">
              {[1, 0.9, 0.95, 0.7, 0.85, 0.6].map((w, i) => (
                <div key={i} className="h-3 rounded bg-slate-800/40" style={{ width: `${w * 100}%` }} />
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {[0.8, 1, 0.75].map((w, i) => (
                <div key={i} className="h-3 rounded bg-slate-800/30" style={{ width: `${w * 100}%` }} />
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-mono text-xs">Composing report...</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isRunning && !report && (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 border border-white/5">
                <FileText className="h-7 w-7 text-slate-600" />
              </div>
              <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-indigo-600/30 border border-indigo-500/30" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-500">No report yet</p>
              <p className="mt-1 text-xs text-slate-700 font-mono">
                Enter a research goal above to begin
              </p>
            </div>
          </div>
        )}

        {/* Rendered report */}
        {report && (
          <div className="report-prose max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-100 font-sans border-b border-white/10 pb-4">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-8 mb-3 text-lg font-semibold text-slate-200 font-sans flex items-center gap-2">
                    <span className="h-px flex-1 bg-gradient-to-r from-indigo-500/40 to-transparent" />
                    {children}
                    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-transparent" />
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-5 mb-2 text-base font-semibold text-indigo-300 font-sans">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-3 text-[14px] leading-[1.85] text-slate-400 font-sans">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 space-y-1.5 pl-1">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2.5 text-[14px] text-slate-400 font-sans leading-relaxed">
                    <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-indigo-500" />
                    <span>{children}</span>
                  </li>
                ),
                ol: ({ children }) => (
                  <ol className="mb-4 space-y-1.5 pl-4 list-decimal text-[14px] text-slate-400 font-sans leading-relaxed marker:text-indigo-500">
                    {children}
                  </ol>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-slate-200">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-slate-500">{children}</em>
                ),
                code: ({ children }) => (
                  <code className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[12px] font-mono text-indigo-300 border border-white/5">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-4 border-l-2 border-indigo-500 pl-4 text-slate-500 italic">
                    {children}
                  </blockquote>
                ),
                hr: () => (
                  <hr className="my-6 border-none h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                ),
                a: ({ href, children }) => (
                  <a href={href} className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300">
                    {children}
                  </a>
                ),
              }}
            >
              {report.markdown}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}