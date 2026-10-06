"use client";
import { AppearanceSwitcher } from "./appearance";
import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Profile, Snapshot, roles, canAdmin, canEnter } from "@/lib/identity";
import { browserClient } from "@/lib/supabase/client";
export async function workflowRequest(body: unknown) {
  const response = await fetch("/api/workflow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error || "Request failed.");
  return data.result;
}
export function Avatar({ profile }: { profile: Profile }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [profile.avatar_url]);
  return (
    <span className="sc-logo">
      {profile.avatar_url && !failed ? (
        <Image
          unoptimized
          src={profile.avatar_url}
          width={44}
          height={44}
          alt={`${profile.display_name} profile`}
          onError={() => setFailed(true)}
        />
      ) : (
        profile.display_name.slice(0, 2).toUpperCase()
      )}
    </span>
  );
}
export function ProfileForm({
  snapshot,
  onSaved,
  disabled = false,
}: {
  snapshot: Snapshot;
  onSaved: () => Promise<void>;
  disabled?: boolean;
}) {
  const p = snapshot.profile;
  const [name, setName] = useState(p.display_name),
    [username, setUsername] = useState(p.username),
    [role, setRole] = useState(p.requested_role),
    [file, setFile] = useState<File | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let avatarPath: string | null = null;
      if (file) {
        const data = new FormData();
        data.append("avatar", file);
        const response = await fetch("/api/workflow", {
            method: "POST",
            body: data,
          }),
          body = await response.json();
        if (!response.ok) throw Error(body.error);
        avatarPath = body.path;
      }
      await workflowRequest({
        action: "profile",
        displayName: name,
        username,
        role,
        avatarPath,
      });
      await onSaved();
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile could not be saved.");
    }
    setBusy(false);
  }
  return (
    <>
      <p className="sc-eyebrow">YOUR IFAGRITHM PROFILE</p>
      <h1>{p.setup_complete ? "Profile" : "Make it yours."}</h1>
      <p className="sc-intro">
        Your username identifies your contributions. Your account email stays
        private.
      </p>
      <div className="profile-heading">
        <Avatar profile={p} />
        <div>
          <strong>{p.display_name}</strong>
          <p className="sc-muted">
            {snapshot.email} · Private account identifier
          </p>
        </div>
      </div>
      <form className="sc-form" onSubmit={submit}>
        <div className="sc-form-grid">
          <label>
            Display name
            <input
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Username
            <input
              required
              pattern="[a-z0-9_]{3,24}"
              maxLength={24}
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
            />
            <small>
              3–24 lowercase letters, numbers or underscores. Must be unique.
            </small>
          </label>
          <label>
            Profile image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <small>
              Google image is used automatically. Optional upload, maximum 2 MB.
            </small>
          </label>
          <label>
            Request role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Profile["role"])}
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <small>
              Admin approves access and role changes. Selecting Admin grants no
              permissions.
            </small>
          </label>
        </div>
        {error && (
          <p role="alert" className="sc-alert">
            {error}
          </p>
        )}
        {saved && <p role="status">Profile saved.</p>}
        <div className="sc-form-end">
          <span>
            Current access: {p.access_status} · {p.role}
          </span>
          <button className="sc-primary" disabled={busy || disabled}>
            {busy
              ? "Saving…"
              : p.setup_complete
                ? "Save profile"
                : "Continue to Ifagrithm"}
          </button>
        </div>
      </form>
    </>
  );
}
export function SignOut() {
  return (
    <button
      onClick={async () => {
        await browserClient().auth.signOut();
        location.assign("/sign-in");
      }}
    >
      Sign out
    </button>
  );
}
export function AccessGate({
  snapshot,
  onRefresh,
}: {
  snapshot: Snapshot;
  onRefresh: () => Promise<void>;
}) {
  return (
    <main className="identity-page">
      <div className="identity-appearance">
        <AppearanceSwitcher />
      </div>
      <div className="identity-card scout">
        {!snapshot.profile.setup_complete ? (
          <ProfileForm snapshot={snapshot} onSaved={onRefresh} />
        ) : (
          <>
            <Avatar profile={snapshot.profile} />
            <p className="sc-eyebrow">
              ACCESS / {snapshot.profile.access_status.toUpperCase()}
            </p>
            <h1>
              {snapshot.profile.access_status === "Suspended"
                ? "Workspace access suspended."
                : "Your profile is ready."}
            </h1>
            <p>
              {snapshot.profile.access_status === "Suspended"
                ? "Contact your workspace admin to review access."
                : "An admin needs to approve your account before you can view company records or submit observations."}
            </p>
            <p className="sc-muted">
              Requested role: {snapshot.profile.requested_role}
            </p>
            <button className="sc-primary" onClick={() => onRefresh()}>
              Check approval
            </button>
            <details>
              <summary>Edit profile</summary>
              <ProfileForm snapshot={snapshot} onSaved={onRefresh} />
            </details>
          </>
        )}
        <div className="identity-signout">
          <SignOut />
        </div>
      </div>
    </main>
  );
}
export { canAdmin, canEnter };
