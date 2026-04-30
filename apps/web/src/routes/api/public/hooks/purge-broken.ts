/**
 * purge-broken.ts
 * POST /api/public/hooks/purge-broken
 *
 * Tests all videos in the public_videos table and removes broken ones.
 * Uses a failure counter approach - videos are marked inactive after
 * multiple consecutive failures, and hard-deleted after reaching the limit.
 *
 * ?batchSize=N    (default 50)   — how many videos to check per run
 * ?maxFailures=N  (default 3)    — failures before hard delete
 * ?hardDelete=true/false (default true) — whether to delete or just mark inactive
 */

import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ─── Types ────────────────────────────────────────────────────────────────────

type VideoRow = {
  id: string;
  source_url: string;
  kind: string;
  provider: string;
  failure_count: number;
  is_active: boolean;
  last_checked_at: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVER_HEADERS = {
  "User-Agent": "NexusPlatform/1.0 (purge-broken)",
  "Accept": "application/json",
};

const PROBE_TIMEOUT_MS = 8000;

// ─── Probe helpers ────────────────────────────────────────────────────────────

function timeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

async function probeNative(url: string): Promise<boolean> {
  try {
    const head = await timeout(
      fetch(url, { method: "HEAD", headers: { "User-Agent": SERVER_HEADERS["User-Agent"] } }),
      PROBE_TIMEOUT_MS,
      null as unknown as Response
    );
    if (head?.ok) {
      const ct = head.headers.get("content-type") ?? "";
      if (ct.startsWith("video/") || ct.includes("octet-stream") || /\.(mp4|webm|ogg)($|\?)/i.test(url)) return true;
    }
  } catch { /* fall through */ }
  try {
    const get = await timeout(
      fetch(url, { method: "GET", headers: { Range: "bytes=0-2047", "User-Agent": SERVER_HEADERS["User-Agent"] } }),
      PROBE_TIMEOUT_MS + 2000,
      null as unknown as Response
    );
    if (!get) return false;
    if (!get.ok && get.status !== 206) return false;
    const ct = get.headers.get("content-type") ?? "";
    return ct.startsWith("video/") || ct.includes("octet-stream") || /\.(mp4|webm|ogg)($|\?)/i.test(url);
  } catch { return false; }
}

async function probeYouTube(videoId: string): Promise<boolean> {
  try {
    const res = await timeout(
      fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
        headers: SERVER_HEADERS,
      }),
      PROBE_TIMEOUT_MS,
      null as unknown as Response
    );
    return res?.status === 200;
  } catch { return false; }
}

async function probeVideo(row: VideoRow): Promise<boolean> {
  if (row.kind === "youtube" || row.provider === "youtube") {
    try {
      const url = new URL(row.source_url);
      const videoId = url.searchParams.get("v") ?? url.pathname.split("/").filter(Boolean).pop() ?? "";
      if (videoId.length >= 5) return await probeYouTube(videoId);
    } catch { return false; }
    return false;
  }
  return probeNative(row.source_url);
}

async function probeAll(items: VideoRow[], concurrency = 10): Promise<boolean[]> {
  const results: boolean[] = new Array(items.length).fill(false);
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(probeVideo));
    batchResults.forEach((r, j) => {
      results[i + j] = r.status === "fulfilled" ? r.value : false;
    });
  }
  return results;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export const Route = createFileRoute("/api/public/hooks/purge-broken")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});

async function handle(request: Request) {
  const url = new URL(request.url);
  const batchSize = Math.min(Math.max(parseInt(url.searchParams.get("batchSize") ?? "50"), 10), 200);
  const maxFailures = Math.max(parseInt(url.searchParams.get("maxFailures") ?? "3"), 1);
  const hardDelete = url.searchParams.get("hardDelete") !== "false";

  const log: string[] = [];
  const t0 = Date.now();

  // ── Step 1: Get total counts ───────────────────────────────────────────
  const { count: totalActive } = await supabaseAdmin
    .from("public_videos")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: totalInactive } = await supabaseAdmin
    .from("public_videos")
    .select("*", { count: "exact", head: true })
    .eq("is_active", false);

  log.push(`Total active: ${totalActive ?? 0}, inactive: ${totalInactive ?? 0}`);

  // ── Step 2: Fetch videos to check ──────────────────────────────────────
  // Prioritize: videos never checked, then oldest checked, then those with failures
  const { data: videosToCheck, error: fetchErr } = await supabaseAdmin
    .from("public_videos")
    .select("id, source_url, kind, provider, failure_count, is_active, last_checked_at")
    .eq("is_active", true)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(batchSize);

  if (fetchErr) {
    return Response.json({ ok: false, error: fetchErr.message }, { status: 500 });
  }

  if (!videosToCheck || videosToCheck.length === 0) {
    log.push("No videos to check");
    return Response.json({ ok: true, checked: 0, broken: 0, deleted: 0, log });
  }

  log.push(`Checking ${videosToCheck.length} videos...`);

  // ── Step 3: Probe all videos ───────────────────────────────────────────
  const playable = await probeAll(videosToCheck, 10);

  let checkedCount = 0;
  let stillWorking = 0;
  let nowBroken: string[] = [];

  const videosToUpdate: Array<{ id: string; working: boolean }> = [];

  videosToCheck.forEach((row, i) => {
    checkedCount++;
    if (playable[i]) {
      stillWorking++;
      videosToUpdate.push({ id: row.id, working: true });
    } else {
      nowBroken.push(row.id);
      videosToUpdate.push({ id: row.id, working: false });
    }
  });

  log.push(`Checked: ${checkedCount}, working: ${stillWorking}, broken: ${nowBroken.length}`);

  // ── Step 4: Update failure counts ──────────────────────────────────────
  let markedInactive = 0;
  let deletedCount = 0;

  if (nowBroken.length > 0) {
    // Get current failure counts for broken videos
    const brokenVideos = videosToCheck.filter(v => nowBroken.includes(v.id));

    const toMarkInactive: string[] = [];
    const toDelete: string[] = [];

    for (const video of brokenVideos) {
      const newCount = (video.failure_count ?? 0) + 1;
      if (newCount >= maxFailures && hardDelete) {
        toDelete.push(video.id);
      } else {
        toMarkInactive.push(video.id);
      }
    }

    // Mark as inactive and increment failure count
    if (toMarkInactive.length > 0) {
      const { error: updateErr } = await supabaseAdmin
        .from("public_videos")
        .update({
          is_active: false,
          failure_count: supabaseAdmin.rpc("increment_failure_count"),
          last_checked_at: new Date().toISOString(),
        })
        .in("id", toMarkInactive);

      if (updateErr) {
        // Fallback: update one by one
        for (const id of toMarkInactive) {
          const video = brokenVideos.find(v => v.id === id);
          await supabaseAdmin
            .from("public_videos")
            .update({
              is_active: false,
              failure_count: (video?.failure_count ?? 0) + 1,
              last_checked_at: new Date().toISOString(),
            })
            .eq("id", id);
        }
      }
      markedInactive = toMarkInactive.length;
      log.push(`Marked inactive: ${markedInactive}`);
    }

    // Hard delete videos that exceeded max failures
    if (toDelete.length > 0) {
      const { error: deleteErr } = await supabaseAdmin
        .from("public_videos")
        .delete()
        .in("id", toDelete);

      if (!deleteErr) {
        deletedCount = toDelete.length;
        log.push(`Hard deleted: ${deletedCount}`);
      } else {
        log.push(`Delete error: ${deleteErr.message}`);
      }
    }
  }

  // ── Step 5: Update working videos ──────────────────────────────────────
  const workingIds = videosToUpdate.filter(v => v.working).map(v => v.id);
  if (workingIds.length > 0) {
    await supabaseAdmin
      .from("public_videos")
      .update({
        failure_count: 0,
        last_checked_at: new Date().toISOString(),
      })
      .in("id", workingIds);
  }

  // ── Step 6: Clean up old inactive videos ───────────────────────────────
  // Delete inactive videos that are older than 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: cleanedUp } = await supabaseAdmin
    .from("public_videos")
    .delete()
    .eq("is_active", false)
    .lt("created_at", thirtyDaysAgo);

  if (cleanedUp) {
    log.push(`Cleaned up old inactive: ${cleanedUp}`);
    deletedCount += cleanedUp;
  }

  // ── Step 7: Get final counts ───────────────────────────────────────────
  const { count: finalActive } = await supabaseAdmin
    .from("public_videos")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const elapsed = Date.now() - t0;

  log.push(`Final active count: ${finalActive ?? 0}`);
  log.push(`Completed in ${elapsed}ms`);

  return Response.json({
    ok: true,
    elapsed_ms: elapsed,
    checked: checkedCount,
    working: stillWorking,
    marked_inactive: markedInactive,
    deleted: deletedCount,
    final_active_count: finalActive ?? 0,
    log,
  });
}