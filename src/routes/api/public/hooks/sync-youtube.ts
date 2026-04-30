import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---- Types ---------------------------------------------------------------
type YTSearchItem = {
  id: { kind: string; videoId?: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
};

type YTSearchResponse = { items?: YTSearchItem[]; error?: { message: string } };

type SourceRow = {
  id: string;
  kind: "channel" | "query";
  value: string;
  category: string;
  max_results: number;
};

// ---- Helpers -------------------------------------------------------------
const YT_BASE = "https://www.googleapis.com/youtube/v3/search";

function pickThumb(t: YTSearchItem["snippet"]["thumbnails"]) {
  return t.high?.url ?? t.medium?.url ?? t.default?.url ?? null;
}

async function fetchSourceVideos(src: SourceRow, apiKey: string): Promise<YTSearchItem[]> {
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: String(Math.min(src.max_results, 50)),
    order: "date",
    key: apiKey,
  });
  if (src.kind === "channel") params.set("channelId", src.value);
  else params.set("q", src.value);

  const res = await fetch(`${YT_BASE}?${params.toString()}`);
  const json = (await res.json()) as YTSearchResponse;
  if (!res.ok) throw new Error(json.error?.message || `YouTube API ${res.status}`);
  return (json.items ?? []).filter((i) => i.id?.videoId);
}

// ---- Route ---------------------------------------------------------------
export const Route = createFileRoute("/api/public/hooks/sync-youtube")({
  server: {
    handlers: {
      POST: async () => handle(),
      GET: async () => handle(), // allow manual trigger from a browser
    },
  },
});

async function handle() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, error: "Missing YOUTUBE_API_KEY" }, { status: 500 });
  }

  const { data: sources, error: srcErr } = await supabaseAdmin
    .from("youtube_sources")
    .select("id, kind, value, category, max_results")
    .eq("is_active", true);

  if (srcErr) return Response.json({ ok: false, error: srcErr.message }, { status: 500 });
  if (!sources?.length) return Response.json({ ok: true, inserted: 0, note: "no sources" });

  let totalInserted = 0;
  const perSource: Array<{ id: string; inserted: number; error?: string }> = [];

  for (const src of sources as SourceRow[]) {
    try {
      const items = await fetchSourceVideos(src, apiKey);
      if (items.length === 0) {
        perSource.push({ id: src.id, inserted: 0 });
        await supabaseAdmin
          .from("youtube_sources")
          .update({ last_synced_at: new Date().toISOString(), last_error: null })
          .eq("id", src.id);
        continue;
      }

      const videoIds = items.map((i) => i.id.videoId!) as string[];
      const sourceUrls = videoIds.map((id) => `https://www.youtube.com/watch?v=${id}`);

      // Find which already exist so we skip them
      const { data: existing } = await supabaseAdmin
        .from("public_videos")
        .select("source_url")
        .in("source_url", sourceUrls);

      const existingSet = new Set((existing ?? []).map((r) => r.source_url));

      const rows = items
        .filter((it) => !existingSet.has(`https://www.youtube.com/watch?v=${it.id.videoId}`))
        .map((it) => {
          const vid = it.id.videoId!;
          return {
            title: it.snippet.title.slice(0, 200),
            description: (it.snippet.description ?? "").slice(0, 500) || null,
            author: it.snippet.channelTitle ?? null,
            provider: "youtube",
            source_url: `https://www.youtube.com/watch?v=${vid}`,
            page_url: `https://www.youtube.com/watch?v=${vid}`,
            poster_url: pickThumb(it.snippet.thumbnails),
            kind: "youtube",
            category: src.category,
            is_active: true,
          };
        });

      if (rows.length > 0) {
        const { error: insErr } = await supabaseAdmin.from("public_videos").insert(rows);
        if (insErr) throw insErr;
        totalInserted += rows.length;
      }

      perSource.push({ id: src.id, inserted: rows.length });
      await supabaseAdmin
        .from("youtube_sources")
        .update({ last_synced_at: new Date().toISOString(), last_error: null })
        .eq("id", src.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[sync-youtube] source ${src.id} failed:`, msg);
      perSource.push({ id: src.id, inserted: 0, error: msg });
      await supabaseAdmin
        .from("youtube_sources")
        .update({ last_synced_at: new Date().toISOString(), last_error: msg.slice(0, 500) })
        .eq("id", src.id);
    }
  }

  return Response.json({ ok: true, inserted: totalInserted, sources: perSource });
}