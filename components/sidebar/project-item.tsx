"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { ContentProject } from "@/lib/db/schema";

interface ProjectItemProps {
  project: ContentProject;
  active: boolean;
}

export function ProjectItem({ project, active }: ProjectItemProps) {
  return (
    <Link
      href={`/project/${project.id}`}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-sm",
        active
          ? "bg-accent/10 text-accent"
          : "text-text-dim hover:bg-surface-2 hover:text-text-primary"
      )}
    >
      <FileText size={15} className="flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{project.name}</p>
        <p className="text-[11px] text-text-muted truncate">
          {formatDate(project.createdAt)}
        </p>
      </div>
    </Link>
  );
}
