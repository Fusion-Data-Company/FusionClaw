import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { shifts, checklistItems, uploads } from "@/lib/db/schema";
import { getCurrentMatOpsUser } from "@/lib/mat-ops/auth";
import { eq } from "drizzle-orm";

const ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "application/pdf",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentMatOpsUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const shiftId = formData.get("shiftId") as string | null;
        const checklistItemId = formData.get("checklistItemId") as string | null;
        const category = (formData.get("category") as string) || "SOCIAL";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!shiftId) {
            return NextResponse.json({ error: "No shift ID provided" }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Allowed: PNG, JPEG, WebP, GIF, HEIC, HEIF, PDF." },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB." },
                { status: 400 }
            );
        }

        // Verify shift exists and belongs to user
        const shift = await db.query.shifts.findFirst({
            where: eq(shifts.id, shiftId),
        });

        if (!shift) {
            return NextResponse.json({ error: "Shift not found" }, { status: 404 });
        }

        if (shift.userId !== user.id && user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Reject uploads for submitted/locked shifts
        if (shift.status !== "OPEN") {
            return NextResponse.json(
                { error: "Cannot upload to a submitted shift" },
                { status: 400 }
            );
        }

        // Validate checklistItemId belongs to the shift
        if (checklistItemId) {
            const item = await db.query.checklistItems.findFirst({
                where: eq(checklistItems.id, checklistItemId),
            });
            if (!item || item.shiftId !== shiftId) {
                return NextResponse.json(
                    { error: "Checklist item does not belong to this shift" },
                    { status: 400 }
                );
            }
        }

        // Upload to Vercel Blob
        const blob = await put(`mat-ops/uploads/${shiftId}/${Date.now()}-${file.name}`, file, {
            access: "public",
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        // Create upload record
        const [upload] = await db.insert(uploads).values({
            shiftId,
            checklistItemId: checklistItemId || null,
            category: category as "SOCIAL" | "BLOG" | "OUTREACH" | "EMAIL",
            blobUrl: blob.url,
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
        }).returning();

        return NextResponse.json(upload);
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
