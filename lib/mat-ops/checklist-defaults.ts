// Types matching Drizzle schema enums
export type ChecklistCategory = "SOCIAL" | "BLOG";
export type Checkpoint = "AM8" | "PM12" | "PM4";
export type Platform = "FACEBOOK" | "LINKEDIN" | "INSTAGRAM" | "YOUTUBE" | "BLOG";

export interface ChecklistDefault {
    key: string;
    label: string;
    category: ChecklistCategory;
    checkpoint: Checkpoint | null;
    platform: Platform | null;
}

// Platforms that get checked at every checkpoint (8am, 12pm, 4pm)
const socialPlatforms: { key: string; label: string; platform: Platform }[] = [
    { key: "facebook", label: "Facebook", platform: "FACEBOOK" },
    { key: "linkedin", label: "LinkedIn", platform: "LINKEDIN" },
    { key: "instagram", label: "Instagram", platform: "INSTAGRAM" },
];

const checkpoints: { key: string; label: string; checkpoint: Checkpoint }[] = [
    { key: "8am", label: "8:00 AM", checkpoint: "AM8" },
    { key: "12pm", label: "12:00 PM", checkpoint: "PM12" },
    { key: "4pm", label: "4:00 PM", checkpoint: "PM4" },
];

export const CHECKLIST_DEFAULTS: ChecklistDefault[] = [
    // Social: 3 checkpoints × 3 platforms (FB, LI, IG) = 9 items
    ...checkpoints.flatMap((cp) =>
        socialPlatforms.map((p) => ({
            key: `social_${p.key}_${cp.key}`,
            label: `${p.label} — ${cp.label} Check`,
            category: "SOCIAL" as ChecklistCategory,
            checkpoint: cp.checkpoint,
            platform: p.platform,
        }))
    ),
    // YouTube: 1 video post per day at lunch (12 PM only)
    {
        key: "social_youtube_12pm",
        label: "YouTube — 12:00 PM Video Post",
        category: "SOCIAL",
        checkpoint: "PM12",
        platform: "YOUTUBE",
    },
    // Message & Engagement: daily items (no checkpoint)
    ...[...socialPlatforms, { key: "youtube", label: "YouTube", platform: "YOUTUBE" as Platform }].map((p) => ({
        key: `messages_${p.key}`,
        label: `${p.label} — Check & Respond to ${p.platform === "YOUTUBE" ? "Comments" : "Messages"}`,
        category: "SOCIAL" as ChecklistCategory,
        checkpoint: null,
        platform: p.platform,
    })),
    // Blog: 1 item
    {
        key: "blog_check_daily",
        label: "Blog — Daily Verification",
        category: "BLOG",
        checkpoint: null,
        platform: "BLOG",
    },
];
