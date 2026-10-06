"use client";
import { useState } from "react";
import Image from "next/image";
import { browserClient } from "@/lib/supabase/client";
export default function SignIn({
  configured,
  initialError = "",
}: {
  configured: boolean;
  initialError?: string;
}) {
  const [error, setError] = useState(initialError),
    [busy, setBusy] = useState(false);
  async function login() {
    setBusy(true);
    try {
      const { error } = await browserClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}/auth/callback`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch {
      setError(
        "Google sign-in could not start. Check the configured Google provider and try again.",
      );
      setBusy(false);
    }
  }
  return (
    <main className="identity-page">
      <div className="identity-card">
        <Image
          src="/brand-symbol-transparent.png"
          alt="IFAGRITHM"
          width={45}
          height={45}
        />
        <p className="sc-eyebrow">IFAGRITHM / INTERNAL WORKSPACE</p>
        <h1>
          Company memory.
          <br />
          Connected to the people
          <br />
          doing the work.
        </h1>
        <p>
          Sign in with Google, set up your profile, then join the scout
          workspace.
        </p>
        <button
          className="identity-google"
          disabled={!configured || busy}
          onClick={login}
        >
          {busy ? "Connecting…" : "Sign in with Google"}
        </button>
        {!configured && (
          <div role="status" className="sc-alert">
            Google sign-in awaits configuration of the Supabase project and
            Google provider. It is not active yet.
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <small>
          Workspace access requires admin approval. Your email stays private;
          your username identifies your contributions.
        </small>
        <a className="identity-demo" href="/demo">
          Previous local demonstration ↗
        </a>
        <div className="identity-demo-links">
          <a href="/demo/worker">Worker preview ↗</a>
          <a href="/demo/admin">Admin preview ↗</a>
        </div>
      </div>
    </main>
  );
}
