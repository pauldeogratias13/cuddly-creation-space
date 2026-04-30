import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---- Types ---------------------------------------------------------------
type VideoRow = {
  id: string;
  source_url: string;
  provider: string;
  kind: string;
  title: string;
};

type TestResult = {
  id: string;
  source_url: string;
  title: string;
  playable: boolean;
  reason?: string;
};

// ---- Helpers -------------------------------------------------------------

/**
 * Test a YouTube video via oEmbed.
 * Returns { playable: true } if 200, otherwise { playable: false, reason }.
 */
async function testYouTubeVideo(
  url: string
): Promise<{ playable: boolean; reason?: string }> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, {
      method: "GET",
      headers: {
        "User-Agent": "NexusPlatform/1.0 (video-tester)",
        "Accept": "application/json",
        "Referer": "https://cuddly-creation-space.lovable.app/",
        "Origin": "https://cuddly-creation-space.lovable.app",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.status === 200) return { playable: true };
    if (res.status === 401) return { playable: false, reason: "private or age-restricted" };
    if (res.status === 403) return { playable: false, reason: "forbidden / geo-blocked" };
    if (res.status === 404) return { playable: false, reason: "video not found / deleted" };
    return { playable: false, reason: `HTTP ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timeout") || msg.includes("aborted")) {
      return { playable: false, reason: "request timed out" };
    }
    return { playable: false, reason: `network error: ${msg}` };
  }
}

/**
 * Test a generic video URL by performing a HEAD request.
 * Works for mp4, hls, dash, etc.
 */
async function testGenericVideo(
  url: string
): Promise<{ playable: boolean; reason?: string }> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "NexusPlatform/1.0 (video-tester)",
        "Referer": "https://cuddly-creation-space.lovable.app/",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { playable: true };
    return { playable: false, reason: `HTTP ${res.status}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { playable: false, reason: `network error: ${msg}` };
  }
}

/**
 * Route all test logic by provider/kind.
 */
async function testVideo(
  row: VideoRow
): Promise<{ playable: boolean; reason?: string }> {
  if (row.provider === "youtube" || row.kind === "youtube") {
    return testYouTubeVideo(row.source_url);
  }
  // For all other providers try a HEAD probe on the direct source URL
  return testGenericVideo(row.source_url);
}

// ---- Route ---------------------------------------------------------------
export const Route = createFileRoute("/api/public/hooks/test-videos")({
  server: {
    handlers: {
      GET: async ({ request }) => handleTest(request),
      POST: async ({ request }) => handleTest(request),
    },
  },
});

async function handleTest(request: Request) {
  const url = new URL(request.url);

  // Optional params
  // ?limit=N   — how many videos to test in this run (default 50, max 200)
  // ?category  — only test videos of this category
  // ?fix=true  — actually mark broken videos is_active=false in DB (default true)
  // ?id=uuid   — test a single video by ID
  const limitParam = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);
  const categoryParam = url.searchParams.get("category");
  const fix = url.searchParams.get("fix") !== "false"; // default true
  const singleId = url.searchParams.get("id");

  // Build query
  let query = supabaseAdmin
    .from("public_videos")
    .select("id, source_url, provider, kind, title")
    .order("created_at", { ascending: false });

  if (singleId) {
    query = query.eq("id", singleId);
  } else {
    query = query.eq("is_active", true).limit(limitParam);
    if (categoryParam) query = query.eq("category", categoryParam);
  }

  const { data: videos, error: fetchErr } = await query;
  if (fetchErr) {
    return Response.json({ ok: false, error: fetchErr.message }, { status: 500 });
  }
  if (!videos?.length) {
    return Response.json({ ok: true, tested: 0, broken: 0, fixed: 0, results: [] });
  }

  // Run tests in controlled concurrency (max 10 parallel)
  const CONCURRENCY = 10;
  const results: TestResult[] = [];
  const brokenIds: string[] = [];

  for (let i = 0; i < videos.length; i += CONCURRENCY) {
    const batch = (videos as VideoRow[]).slice(i, i + CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map(async (row) => {
        const { playable, reason } = await testVideo(row);
        return { id: row.id, source_url: row.source_url, title: row.title, playable, reason };
      })
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled") {
        results.push(r.value);
        if (!r.value.playable) brokenIds.push(r.value.id);
      } else {
        // Promise itself rejected (shouldn't happen given internal try/catch)
        console.error("[test-videos] unexpected rejection:", r.reason);
      }
    }
  }

  // Mark broken videos inactive in DB
  let fixedCount = 0;
  if (fix && brokenIds.length > 0) {
    const { error: updateErr } = await supabaseAdmin
      .from("public_videos")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in("id", brokenIds);
    if (updateErr) {
      console.error("[test-videos] failed to deactivate broken videos:", updateErr.message);
    } else {
      fixedCount = brokenIds.length;
    }
  }

  const playableResults = results.filter((r) => r.playable);
  const brokenResults = results.filter((r) => !r.playable);

  return Response.json({
    ok: true,
    tested: results.length,
    playable: playableResults.length,
    broken: brokenResults.length,
    fixed: fixedCount,
    results: {
      broken: brokenResults,
      // Only include playable list if testing a single video or small batch
      ...(results.length <= 20 ? { playable: playableResults } : {}),
    },
  });
}
