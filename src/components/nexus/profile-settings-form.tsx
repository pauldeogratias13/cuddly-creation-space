import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type ProfileSettingsFormProps = {
  className?: string;
};

export function ProfileSettingsForm({ className = "" }: ProfileSettingsFormProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [bioInput, setBioInput] = useState("");

  useEffect(() => {
    setDisplayNameInput(profile?.display_name ?? "");
    setHandleInput(profile?.handle ?? "");
    setBioInput(profile?.bio ?? "");
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    const nextHandle = handleInput.trim().replace(/^@/, "") || null;
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayNameInput.trim() || null,
        handle: nextHandle,
        bio: bioInput.trim() || null,
      })
      .eq("id", user.id);
    if (error) {
      toast.error("Profile update failed");
      return;
    }
    await refreshProfile();
    toast.success("Profile updated");
    await supabase.from("user_notifications").insert({
      user_id: user.id,
      type: "profile",
      title: "Profile updated",
      body: "Your identity settings were saved.",
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={displayNameInput}
          onChange={(e) => setDisplayNameInput(e.target.value)}
          placeholder="Display name"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={handleInput}
          onChange={(e) => setHandleInput(e.target.value)}
          placeholder="@handle"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <textarea
        value={bioInput}
        onChange={(e) => setBioInput(e.target.value)}
        placeholder="Short bio"
        maxLength={240}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={saveProfile}
        className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Save profile
      </button>
    </div>
  );
}
