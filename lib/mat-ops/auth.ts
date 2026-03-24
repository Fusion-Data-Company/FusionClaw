import { getCurrentUser, requireUser, requireRole, requireAdmin } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";

// Re-export from main auth module for backwards compatibility
export type { UserRole };
export const getCurrentMatOpsUser = getCurrentUser;
export const requireMatOpsUser = requireUser;
export const requireMatOpsRole = requireRole;
export const requireMatOpsAdmin = requireAdmin;
