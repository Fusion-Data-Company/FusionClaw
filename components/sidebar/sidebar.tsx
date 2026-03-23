"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  FolderOpen,
  Settings,
  Paintbrush,
  Globe,
  LayoutGrid,
} from "lucide-react";
import { ProjectItem } from "./project-item";
import { NewProjectDialog } from "./new-project-dialog";
import type { ContentProject } from "@/lib/db/schema";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load projects");
        return r.json();
      })
      .then((data) => setProjects(data))
      .catch((err) => console.error("Sidebar: failed to load projects:", err));
  }, [pathname]);

  const handleProjectCreated = (project: ContentProject) => {
    setProjects((prev) => [project, ...prev]);
    setDialogOpen(false);
    router.push(`/project/${project.id}`);
  };

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 bg-surface border-r border-border">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors mb-4"
          title="Expand sidebar"
        >
          <Image
            src="/logo.png"
            alt="Marketing Strategy"
            width={36}
            height={10}
            className="object-contain"
          />
        </button>
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setDialogOpen(true)}
            className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text-primary transition-colors"
          >
            <FolderOpen size={18} />
          </button>
        </div>
        <div className="flex flex-col items-center gap-2 mt-auto pb-1">
          <button
            onClick={() => router.push("/studio")}
            className={`p-2 rounded-lg hover:bg-surface-2 transition-colors ${
              pathname === "/studio"
                ? "bg-accent/10 text-accent"
                : "text-text-dim hover:text-text-primary"
            }`}
            title="Image Studio"
          >
            <Paintbrush size={18} />
          </button>
          <button
            onClick={() => router.push("/gallery")}
            className={`p-2 rounded-lg hover:bg-surface-2 transition-colors ${
              pathname === "/gallery"
                ? "bg-accent/10 text-accent"
                : "text-text-dim hover:text-text-primary"
            }`}
            title="Gallery"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => router.push("/wordpress")}
            className={`p-2 rounded-lg hover:bg-surface-2 transition-colors ${
              pathname === "/wordpress"
                ? "bg-accent/10 text-accent"
                : "text-text-dim hover:text-text-primary"
            }`}
            title="Publishing Hub"
          >
            <Globe size={18} />
          </button>
          <button
            onClick={() => router.push("/settings")}
            className={`p-2 rounded-lg hover:bg-surface-2 transition-colors ${
              pathname === "/settings"
                ? "bg-accent/10 text-accent"
                : "text-text-dim hover:text-text-primary"
            }`}
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
        <NewProjectDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={handleProjectCreated}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Marketing Strategy"
            width={140}
            height={40}
            className="object-contain"
          />
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-surface-2 text-text-dim hover:text-text-primary transition-colors"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* New Project Button */}
      <div className="px-3 pt-3">
        <button
          onClick={() => setDialogOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-text-muted px-2 mb-2">
          Projects
        </p>
        {projects.length === 0 ? (
          <p className="text-text-muted text-xs px-2 py-4">
            No projects yet. Create one to get started.
          </p>
        ) : (
          <div className="space-y-0.5">
            {projects.map((project) => (
              <ProjectItem
                key={project.id}
                project={project}
                active={pathname === `/project/${project.id}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2 space-y-0.5">
        <button
          onClick={() => router.push("/studio")}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-sm ${
            pathname === "/studio"
              ? "bg-accent/10 text-accent"
              : "hover:bg-surface-2 text-text-dim hover:text-text-primary"
          }`}
        >
          <Paintbrush size={16} />
          Image Studio
        </button>
        <button
          onClick={() => router.push("/gallery")}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-sm ${
            pathname === "/gallery"
              ? "bg-accent/10 text-accent"
              : "hover:bg-surface-2 text-text-dim hover:text-text-primary"
          }`}
        >
          <LayoutGrid size={16} />
          Gallery
        </button>
        <button
          onClick={() => router.push("/wordpress")}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-sm ${
            pathname === "/wordpress"
              ? "bg-accent/10 text-accent"
              : "hover:bg-surface-2 text-text-dim hover:text-text-primary"
          }`}
        >
          <Globe size={16} />
          Publishing Hub
        </button>
        <button
          onClick={() => router.push("/settings")}
          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors text-sm ${
            pathname === "/settings"
              ? "bg-accent/10 text-accent"
              : "hover:bg-surface-2 text-text-dim hover:text-text-primary"
          }`}
        >
          <Settings size={16} />
          Settings
        </button>
      </div>

      <NewProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleProjectCreated}
      />
    </div>
  );
}
