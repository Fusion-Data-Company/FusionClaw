export interface WPCredentials {
  siteUrl: string;
  username: string;
  password: string; // decrypted app password
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WPTag {
  id: number;
  name: string;
  slug: string;
}

export interface WPPost {
  id: number;
  title: { rendered: string };
  link: string;
  status: string;
  date: string;
  categories: number[];
  tags: number[];
  excerpt: { rendered: string };
}

export interface WPPostData {
  title: string;
  content: string;
  status: "draft" | "publish";
  categories?: number[];
  tags?: number[];
  excerpt?: string;
  slug?: string;
  featured_media?: number;
}

function buildAuthHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

export async function testConnection(
  siteUrl: string,
  username: string,
  password: string
): Promise<{
  success: boolean;
  categories?: WPCategory[];
  tags?: WPTag[];
  version?: string;
  error?: string;
}> {
  const authHeader = buildAuthHeader(username, password);
  const baseUrl = siteUrl.replace(/\/+$/, "");

  try {
    // Fetch site info to verify connection
    const siteRes = await fetch(`${baseUrl}/wp-json`, {
      headers: { Authorization: authHeader },
    });

    if (!siteRes.ok) {
      const text = await siteRes.text();
      return {
        success: false,
        error: `Connection failed (${siteRes.status}): ${text.slice(0, 200)}`,
      };
    }

    const siteInfo = await siteRes.json();

    // Fetch categories
    const catRes = await fetch(
      `${baseUrl}/wp-json/wp/v2/categories?per_page=100`,
      { headers: { Authorization: authHeader } }
    );
    const categories: WPCategory[] = catRes.ok
      ? (await catRes.json()).map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }))
      : [];

    // Fetch tags
    const tagRes = await fetch(
      `${baseUrl}/wp-json/wp/v2/tags?per_page=100`,
      { headers: { Authorization: authHeader } }
    );
    const tags: WPTag[] = tagRes.ok
      ? (await tagRes.json()).map((t: any) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
        }))
      : [];

    return {
      success: true,
      categories,
      tags,
      version: siteInfo.version || siteInfo.name || "unknown",
    };
  } catch (err) {
    return {
      success: false,
      error: `Connection error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function uploadMedia(
  creds: WPCredentials,
  imageUrl: string,
  filename?: string
): Promise<{ success: boolean; mediaId?: number; error?: string }> {
  const authHeader = buildAuthHeader(creds.username, creds.password);
  const baseUrl = creds.siteUrl.replace(/\/+$/, "");

  try {
    // Fetch the image
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return { success: false, error: `Failed to fetch image: ${imageRes.status}` };
    }

    const imageBuffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    const ext = contentType.split("/")[1] || "jpg";
    const finalFilename = filename || `featured-image.${ext}`;

    const uploadRes = await fetch(`${baseUrl}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Disposition": `attachment; filename="${finalFilename}"`,
        "Content-Type": contentType,
      },
      body: Buffer.from(imageBuffer),
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return {
        success: false,
        error: `Media upload failed (${uploadRes.status}): ${errText.slice(0, 200)}`,
      };
    }

    const uploadData = await uploadRes.json();
    return { success: true, mediaId: uploadData.id };
  } catch (err) {
    return {
      success: false,
      error: `Media upload error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function createOrFindTags(
  creds: WPCredentials,
  tagNames: string[]
): Promise<number[]> {
  const authHeader = buildAuthHeader(creds.username, creds.password);
  const baseUrl = creds.siteUrl.replace(/\/+$/, "");
  const tagIds: number[] = [];

  for (const tagName of tagNames) {
    try {
      // Search for existing tag
      const searchRes = await fetch(
        `${baseUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(tagName)}`,
        { headers: { Authorization: authHeader } }
      );
      const existing = await searchRes.json();

      const exactMatch = existing.find(
        (t: any) => t.name.toLowerCase() === tagName.toLowerCase()
      );

      if (exactMatch) {
        tagIds.push(exactMatch.id);
      } else {
        // Create new tag
        const createRes = await fetch(`${baseUrl}/wp-json/wp/v2/tags`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: tagName }),
        });

        if (createRes.ok) {
          const newTag = await createRes.json();
          tagIds.push(newTag.id);
        }
      }
    } catch {
      // Skip tags that fail to create
    }
  }

  return tagIds;
}

export async function publishPost(
  creds: WPCredentials,
  postData: WPPostData
): Promise<{
  success: boolean;
  postId?: number;
  url?: string;
  error?: string;
}> {
  const authHeader = buildAuthHeader(creds.username, creds.password);
  const baseUrl = creds.siteUrl.replace(/\/+$/, "");

  try {
    const postRes = await fetch(`${baseUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    if (!postRes.ok) {
      const errData = await postRes.json().catch(() => ({}));
      return {
        success: false,
        error: errData.message || `Failed to create post (${postRes.status})`,
      };
    }

    const result = await postRes.json();
    return {
      success: true,
      postId: result.id,
      url: result.link,
    };
  } catch (err) {
    return {
      success: false,
      error: `Publish error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function fetchPosts(
  creds: WPCredentials,
  params?: { per_page?: number; page?: number }
): Promise<WPPost[]> {
  const authHeader = buildAuthHeader(creds.username, creds.password);
  const baseUrl = creds.siteUrl.replace(/\/+$/, "");

  const query = new URLSearchParams({
    per_page: String(params?.per_page || 20),
    page: String(params?.page || 1),
    _embed: "1",
  });

  const res = await fetch(`${baseUrl}/wp-json/wp/v2/posts?${query}`, {
    headers: { Authorization: authHeader },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status}`);
  }

  return res.json();
}

export async function verifyPost(
  url: string
): Promise<{ success: boolean; statusCode: number; notes: string }> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "ContentCommandCenter/1.0" },
    });

    if (res.ok) {
      const html = await res.text();
      const hasContent = html.length > 1000;
      const hasTitle = html.includes("<title");

      return {
        success: true,
        statusCode: res.status,
        notes: hasContent && hasTitle
          ? "Post is live and accessible. Page contains content and title tag."
          : "Post is accessible but page content may be minimal.",
      };
    }

    return {
      success: false,
      statusCode: res.status,
      notes: `Post returned HTTP ${res.status}. It may not be publicly accessible yet.`,
    };
  } catch (err) {
    return {
      success: false,
      statusCode: 0,
      notes: `Verification failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
