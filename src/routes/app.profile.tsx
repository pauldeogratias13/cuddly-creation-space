import { createFileRoute, Link } from "@tanstack/react-router";
import { ProfileSettingsForm } from "@/components/nexus/profile-settings-form";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — NEXUS" },
      { name: "description", content: "Manage your NEXUS profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Dashboard
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-lg">
        Update how you appear across NEXUS. Changes sync to your workspace and notifications.
      </p>
      <div className="mt-8 max-w-xl rounded-2xl border border-border bg-surface/60 p-6">
        <h2 className="text-lg font-semibold">Identity</h2>
        <ProfileSettingsForm className="mt-4" />
      </div>
    </div>
  );
}
