import { db } from "@/lib/db";
import { apiVault } from "@/lib/db/schema";
import { decrypt } from "@/lib/crypto";
import { eq, and } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContentType = "video" | "photo" | "text";

export interface PlatformOptions {
  tiktokPrivacyLevel?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "SELF_ONLY";
  instagramMediaType?: "REELS" | "FEED" | "STORIES";
  youtubePrivacyStatus?: "public" | "private" | "unlisted";
  linkedinVisibility?: "PUBLIC" | "CONNECTIONS";
  facebookPageId?: string;
  pinterestBoardId?: string;
  redditSubreddit?: string;
  redditTitle?: string;
  threadsMediaType?: string;
  twitterPollOptions?: string[];
  twitterPollDuration?: number;
}

export interface PublishContentInput {
  type: ContentType;
  filePaths?: string[];
  title: string;
  platforms: string[];
  user: string;
  scheduledDate?: string;
  timezone?: string;
  platformOptions?: PlatformOptions;
}

export interface PublishResult {
  success: boolean;
  requestId?: string;
  data?: Record<string, unknown>;
  error?: string;
}

export interface UploadStatus {
  requestId: string;
  status: string;
  platforms?: Record<string, unknown>;
  error?: string;
}

export interface HistoryEntry {
  id: string;
  type: string;
  platforms: string[];
  status: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface HistoryResult {
  data: HistoryEntry[];
  page: number;
  limit: number;
  total?: number;
}

export interface SocialProfile {
  id: string;
  name: string;
  platform: string;
  connected: boolean;
  [key: string]: unknown;
}

export interface AnalyticsResult {
  profile: string;
  platforms: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ConnectProfileResult {
  url: string;
}

// ─── Client Factory ───────────────────────────────────────────────────────────

/**
 * Retrieves the Upload-Post API key from the vault, decrypts it, and
 * returns an initialized UploadPost client instance.
 */
export async function getUploadPostClient() {
  const [entry] = await db
    .select()
    .from(apiVault)
    .where(
      and(
        eq(apiVault.provider, "upload_post"),
        eq(apiVault.status, "active"),
      ),
    )
    .limit(1);

  if (!entry) {
    throw new Error(
      "No active Upload-Post API key found in vault. Add one via Settings > API Keys with provider 'upload_post'.",
    );
  }

  const apiKey = decrypt(entry.encryptedKey);

  // Update lastUsedAt
  await db
    .update(apiVault)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiVault.id, entry.id));

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const UploadPost = require("upload-post");
  return new UploadPost(apiKey);
}

// ─── Publish Content ──────────────────────────────────────────────────────────

/**
 * Routes to upload / uploadPhotos / uploadText based on content type.
 */
export async function publishContent(
  input: PublishContentInput,
): Promise<PublishResult> {
  const client = await getUploadPostClient();
  const { type, filePaths, title, platforms, user, scheduledDate, timezone, platformOptions } = input;

  const baseOptions: Record<string, unknown> = {
    title,
    user,
    platforms,
    asyncUpload: true,
    ...(scheduledDate && { scheduledDate }),
    ...(timezone && { timezone }),
    ...(platformOptions && { ...platformOptions }),
  };

  try {
    let result: Record<string, unknown>;

    switch (type) {
      case "video": {
        if (!filePaths?.[0]) {
          throw new Error("filePaths[0] is required for video uploads");
        }
        result = await client.upload(filePaths[0], baseOptions);
        break;
      }
      case "photo": {
        if (!filePaths?.length) {
          throw new Error("filePaths is required for photo uploads");
        }
        result = await client.uploadPhotos(filePaths, baseOptions);
        break;
      }
      case "text": {
        result = await client.uploadText(baseOptions);
        break;
      }
      default:
        throw new Error(`Unsupported content type: ${type}`);
    }

    return {
      success: true,
      requestId: result.requestId as string | undefined,
      data: result,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error";
    return { success: false, error: message };
  }
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function getPublishStatus(requestId: string): Promise<UploadStatus> {
  const client = await getUploadPostClient();
  const result = await client.getStatus(requestId);
  return result as UploadStatus;
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getPublishHistory(
  page: number = 1,
  limit: number = 20,
): Promise<HistoryResult> {
  const client = await getUploadPostClient();
  const result = await client.getHistory({ page, limit });
  return result as HistoryResult;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalytics(
  profileName: string,
  platforms?: string[],
): Promise<AnalyticsResult> {
  const client = await getUploadPostClient();
  const options: Record<string, unknown> = {};
  if (platforms?.length) {
    options.platforms = platforms;
  }
  const result = await client.getAnalytics(profileName, options);
  return result as AnalyticsResult;
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function listProfiles(): Promise<SocialProfile[]> {
  const client = await getUploadPostClient();
  const result = await client.listUsers();
  return result as SocialProfile[];
}

// ─── Connect Profile ──────────────────────────────────────────────────────────

export async function connectProfile(
  profileName: string,
  redirectUrl?: string,
  platforms?: string[],
): Promise<ConnectProfileResult> {
  const client = await getUploadPostClient();
  const options: Record<string, unknown> = {};
  if (redirectUrl) options.redirectUrl = redirectUrl;
  if (platforms?.length) options.platforms = platforms;
  const result = await client.generateJwt(profileName, options);
  return result as ConnectProfileResult;
}
