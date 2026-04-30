/**
 * auto-crawler.ts
 * 
 * Background service that automatically runs the crawl-and-seed process
 * at regular intervals to ensure the database is always populated with
 * fresh, working videos.
 * 
 * Features:
 * - Runs every 6 hours by default (configurable)
 * - Tracks last run time to avoid duplicate runs
 * - Logs all activity for monitoring
 * - Can be triggered manually via API
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface AutoCrawlerConfig {
  /** Interval between crawls in milliseconds (default: 6 hours) */
  intervalMs: number;
  /** Maximum videos to insert per crawl (default: 500) */
  maxInsertPerCrawl: number;
  /** Whether to purge broken videos (default: true) */
  purgeBroken: boolean;
  /** Minimum videos threshold - crawl if below this (default: 100) */
  minVideoThreshold: number;
}

const DEFAULT_CONFIG: AutoCrawlerConfig = {
  intervalMs: 6 * 60 * 60 * 1000, // 6 hours
  maxInsertPerCrawl: 500,
  purgeBroken: true,
  minVideoThreshold: 100,
};

export class AutoCrawler {
  private config: AutoCrawlerConfig;
  private isRunning: boolean = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<AutoCrawlerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the auto-crawler background service
   */
  start() {
    if (this.intervalId) {
      console.log("[auto-crawler] Already running");
      return;
    }

    console.log(`[auto-crawler] Starting with interval ${this.config.intervalMs}ms`);
    
    // Run immediately on start
    this.run();
    
    // Set up periodic runs
    this.intervalId = setInterval(() => {
      this.run();
    }, this.config.intervalMs);
  }

  /**
   * Stop the auto-crawler background service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[auto-crawler] Stopped");
    }
  }

  /**
   * Run a single crawl cycle
   */
  async run() {
    if (this.isRunning) {
      console.log("[auto-crawler] Already running, skipping");
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      // Check if we need to crawl (below threshold)
      const { count: videoCount } = await supabaseAdmin
        .from("public_videos")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      if ((videoCount ?? 0) >= this.config.minVideoThreshold) {
        console.log(`[auto-crawler] Video count (${videoCount}) above threshold, skipping`);
        return;
      }

      console.log(`[auto-crawler] Video count (${videoCount}) below threshold, starting crawl...`);

      // Trigger the crawl-and-seed endpoint
      const response = await fetch(`${process.env.APP_URL || "http://localhost:3000"}/api/public/hooks/crawl-and-seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          limit: this.config.maxInsertPerCrawl,
          purge: this.config.purgeBroken,
        }),
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log(`[auto-crawler] Crawl completed in ${Date.now() - startTime}ms:`, {
          purged: result.purged,
          crawled: result.crawled,
          inserted: result.inserted,
        });

        // Log the crawl session
        await supabaseAdmin.from("crawl_sessions").insert({
          session_id: `auto_${Date.now()}`,
          source: "auto-crawler",
          query: "scheduled",
          total_found: result.crawled,
          working_found: result.inserted,
          broken_found: result.purged,
          status: "completed",
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
      } else {
        console.error("[auto-crawler] Crawl failed:", result.error);
      }
    } catch (error) {
      console.error("[auto-crawler] Error:", error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get crawler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      intervalId: this.intervalId ? "active" : "stopped",
    };
  }
}

// Export singleton instance
export const autoCrawler = new AutoCrawler();