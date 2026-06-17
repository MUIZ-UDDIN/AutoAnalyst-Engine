"use client";

import { useState } from "react";
import { FileText, Download, Trash2, FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Artifact } from "@/types";

interface ArtifactsSidebarProps {
  artifacts: Artifact[];
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ArtifactRow({
  artifact,
  onDelete,
}: {
  artifact: Artifact;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(artifact.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
    }
  };

  return (
    <div className="group relative rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-150">
      {/* File icon + name */}
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <FileText className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-slate-300 leading-tight">
            {artifact.title}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-slate-600">
            {formatDate(artifact.createdAt)} · {artifact.sizeKb} KB
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <a
          href={artifact.downloadUrl}
          download
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white/5 py-1.5 text-[11px] text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors duration-150"
        >
          <Download className="h-3 w-3" />
          Download
        </a>
        <button
          onClick={handleDelete}
          className={cn(
            "flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] transition-colors duration-150",
            confirmDelete
              ? "bg-red-500/20 text-red-400"
              : "bg-white/5 text-slate-600 hover:bg-red-500/10 hover:text-red-400"
          )}
        >
          <Trash2 className="h-3 w-3" />
          {confirmDelete ? "Sure?" : ""}
        </button>
      </div>
    </div>
  );
}

export default function ArtifactsSidebar({ artifacts, onDelete }: ArtifactsSidebarProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-[#080c14]/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <FolderOpen className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-[11px] font-mono font-medium uppercase tracking-[0.18em] text-slate-500">
          Artifacts
        </span>
        {artifacts.length > 0 && (
          <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500/20 text-[9px] font-mono font-bold text-indigo-400">
            {artifacts.length}
          </span>
        )}
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto p-2 space-y-1.5"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#1e293b transparent" }}
      >
        {artifacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800/60 border border-white/5">
              <Plus className="h-4 w-4 text-slate-600" />
            </div>
            <p className="text-center font-mono text-[11px] text-slate-600 leading-relaxed">
              Completed reports<br />appear here
            </p>
          </div>
        ) : (
          artifacts.map((a) => (
            <ArtifactRow key={a.id} artifact={a} onDelete={onDelete} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-4 py-2.5">
        <p className="font-mono text-[10px] text-slate-700">
          {artifacts.length} report{artifacts.length !== 1 ? "s" : ""} saved
        </p>
      </div>
    </div>
  );
}