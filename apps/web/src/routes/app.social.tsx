import { createFileRoute } from "@tanstack/react-router";
import { SocialFeed } from "@/components/nexus/SocialFeed";

export const Route = createFileRoute("/app/social")({
  head: () => ({
    meta: [
      { title: "NEXUS Social — Intent-First Feed" },
      { name: "description", content: "No rage-bait. No algorithmic manipulation. Your feed, your intent." },
    ],
  }),
  component: SocialFeed,
});
