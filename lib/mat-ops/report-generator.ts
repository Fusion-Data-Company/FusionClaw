import { format } from "date-fns";

// Types matching the Drizzle schema
interface ShiftUser {
    name: string | null;
}

interface ChecklistItem {
    key: string;
    completed: boolean;
}

interface Upload {
    id: string;
}

interface ShiftWithRelations {
    shiftDate: string;
    startedAt: Date;
    endedAt: Date | null;
    upworkNewJobs: number;
    upworkProposals: number;
    upworkFollowups: number;
    upworkReplies: number;
    upworkCallsBooked: number;
    trackerUpdated: boolean;
    notes: string | null;
    user: ShiftUser;
    checklistItems: ChecklistItem[];
    uploads: Upload[];
}

export function generateReportSnapshot(shift: ShiftWithRelations): string {
    const date = shift.shiftDate;
    const operatorName = shift.user.name || "Unknown";
    const startTime = format(new Date(shift.startedAt), "hh:mm a");
    const endTime = shift.endedAt ? format(new Date(shift.endedAt), "hh:mm a") : "N/A";

    // Calculate duration
    let duration = "N/A";
    if (shift.endedAt) {
        const diffMs = new Date(shift.endedAt).getTime() - new Date(shift.startedAt).getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${hours}h ${minutes}m`;
    }

    // Calculate completion
    const totalItems = shift.checklistItems.length;
    const completedItems = shift.checklistItems.filter((i) => i.completed).length;
    const completionPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Social grid
    const checkpoints = [
        { label: "  8:00 AM", key: "8am" },
        { label: " 12:00 PM", key: "12pm" },
        { label: "  4:00 PM", key: "4pm" },
    ];
    const platformKeys = [
        { label: "FB", key: "facebook" },
        { label: "LI", key: "linkedin" },
        { label: "IG", key: "instagram" },
        { label: "YT", key: "youtube" },
    ];

    const socialGrid = checkpoints
        .map((cp) => {
            const platformChecks = platformKeys
                .map((p) => {
                    const item = shift.checklistItems.find(
                        (i) => i.key === `social_${p.key}_${cp.key}`
                    );
                    return `${p.label} ${item?.completed ? "✔" : "✖"}`;
                })
                .join("  ");
            return `${cp.label}   ${platformChecks}`;
        })
        .join("\n");

    const blogItem = shift.checklistItems.find((i) => i.key === "blog_check_daily");
    const blogStatus = blogItem?.completed ? "✔" : "✖";

    const uploadCount = shift.uploads.length;

    const report = `══════════════════════════════════════
  DAILY OPS REPORT
══════════════════════════════════════

DATE:      ${date}
OPERATOR:  ${operatorName}
SHIFT:     ${startTime} – ${endTime} PT
DURATION:  ${duration}
COMPLETION: ${completionPct}% (${completedItems}/${totalItems} items)

──────────────────────────────────────
SOCIAL VERIFICATION
──────────────────────────────────────
${socialGrid}

BLOG: ${blogStatus}

──────────────────────────────────────
ACTIVITY
──────────────────────────────────────
  New Jobs Added:    ${shift.upworkNewJobs}
  Proposals Sent:     ${shift.upworkProposals}
  Follow-ups Sent:    ${shift.upworkFollowups}
  Replies Received:   ${shift.upworkReplies}
  Calls Booked:       ${shift.upworkCallsBooked}

TRACKER UPDATED: ${shift.trackerUpdated ? "✔" : "✖"}

──────────────────────────────────────
PROOF
──────────────────────────────────────
  Uploads: ${uploadCount} files attached

──────────────────────────────────────
NOTES
──────────────────────────────────────
  ${shift.notes || "(none)"}

══════════════════════════════════════`;

    return report;
}
