import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { configured } from "@/lib/supabase/config";
import { domainOf } from "@/lib/scout";
import { roles } from "@/lib/identity";
export const dynamic = "force-dynamic";
function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
function text(value: unknown, max = 4000) {
  if (typeof value !== "string" || value.length > max)
    throw Error("Invalid input.");
  return value.trim();
}
function uuid(value: unknown) {
  const v = text(value, 36);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  )
    throw Error("Invalid record identity.");
  return v;
}
async function session() {
  if (!configured()) throw Error("Supabase is not configured.");
  const client = await serverClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (profileError)
    throw Error(
      "The account schema is not ready. Apply the Stage 1A database migration.",
    );
  return { client, user, profile };
}
export async function GET() {
  try {
    const s = await session();
    if (!s) return json({ error: "Sign in required." }, 401);
    const { client, user, profile } = s;
    if (profile.avatar_path) {
      const { data } = await client.storage
        .from("profile-images")
        .createSignedUrl(profile.avatar_path, 600);
      profile.avatar_url = data?.signedUrl || profile.avatar_url;
    }
    if (profile.access_status !== "Approved" || !profile.setup_complete)
      return json({
        profile,
        profiles: [profile],
        companies: [],
        observations: [],
        sources: [],
        activity: [],
        email: user.email,
      });
    const results = await Promise.all([
      client.from("profiles").select("*"),
      client
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false }),
      client
        .from("observations")
        .select("*")
        .order("created_at", { ascending: false }),
      client.from("observation_sources").select("*"),
      client
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150),
    ]);
    for (const r of results)
      if (r.error) throw Error("Workspace records could not be loaded.");
    const profiles = await Promise.all(
      (results[0].data || []).map(async (p) => {
        if (p.avatar_path) {
          const { data } = await client.storage
            .from("profile-images")
            .createSignedUrl(p.avatar_path, 600);
          return { ...p, avatar_url: data?.signedUrl || p.avatar_url };
        }
        return p;
      }),
    );
    return json({
      profile: profiles.find((p) => p.id === user.id) || profile,
      profiles,
      companies: results[1].data,
      observations: results[2].data,
      sources: results[3].data,
      activity: results[4].data,
      email: user.email,
    });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Workspace unavailable." },
      503,
    );
  }
}
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin)
    return json({ error: "Same-origin request required." }, 403);
  try {
    const s = await session();
    if (!s) return json({ error: "Sign in required." }, 401);
    const { client, user, profile } = s;
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const data = await request.formData(),
        file = data.get("avatar");
      if (
        !(file instanceof File) ||
        file.size > 2097152 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw Error("Upload a PNG, JPEG or WebP image, up to 2 MB.");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const valid =
        bytes.length >= 12 &&
        (file.type === "image/png"
          ? bytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10"
          : file.type === "image/jpeg"
            ? bytes[0] === 255 && bytes[1] === 216
            : bytes.slice(0, 4).every((b, i) => b === [82, 73, 70, 70][i]) &&
              bytes.slice(8, 12).every((b, i) => b === [87, 69, 66, 80][i]));
      if (!valid) throw Error("The image contents do not match its type.");
      const path = `${user.id}/${crypto.randomUUID()}.${file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp"}`;
      const { error } = await client.storage
        .from("profile-images")
        .upload(path, bytes, { contentType: file.type, upsert: false });
      if (error)
        throw Error(
          "Image upload failed. Check the private profile-images bucket.",
        );
      return json({ path });
    }
    const body = await request.json(),
      action = text(body.action, 40);
    let rpc = "",
      args: Record<string, unknown> = {};
    if (action === "profile") {
      const role = text(body.role, 30);
      if (!roles.includes(role as (typeof roles)[number]))
        throw Error("Choose a valid requested role.");
      rpc = "save_profile";
      args = {
        _display_name: text(body.displayName, 80),
        _username: text(body.username, 24),
        _requested_role: role,
        _avatar_path: body.avatarPath ? text(body.avatarPath, 200) : null,
      };
    } else {
      if (profile.avatar_path) {
        const { data } = await client.storage
          .from("profile-images")
          .createSignedUrl(profile.avatar_path, 600);
        profile.avatar_url = data?.signedUrl || profile.avatar_url;
      }
      if (profile.access_status !== "Approved" || !profile.setup_complete)
        return json(
          { error: "Workspace access is pending admin approval." },
          403,
        );
      if (action === "observe") {
        rpc = "submit_observation";
        args = {
          _company_id: body.companyId ? uuid(body.companyId) : null,
          _company_name: text(body.company, 120),
          _domain: domainOf(text(body.website, 255)),
          _category: text(body.category, 80),
          _behaviour: text(body.behaviour, 80),
          _description: text(body.description),
          _detail: text(body.detail || "", 200),
          _observed_on: text(body.observedAt, 10),
          _source: text(body.source, 2048),
          _allow_duplicate: body.allowDuplicate === true,
        };
      } else if (action === "source") {
        rpc = "add_observation_source";
        args = {
          _observation_id: uuid(body.observationId),
          _source: text(body.source, 2048),
        };
      } else {
        if (profile.role !== "Admin")
          return json({ error: "Admin access required." }, 403);
        if (action === "access") {
          rpc = "review_access";
          args = {
            _profile_id: uuid(body.profileId),
            _role: text(body.role, 30),
            _status: text(body.status, 30),
          };
        } else if (action === "company") {
          rpc = "correct_company";
          args = {
            _company_id: uuid(body.companyId),
            _category: text(body.category, 80),
            _status: text(body.status, 30),
          };
        } else if (action === "remove") {
          rpc = "remove_observation";
          args = {
            _observation_id: uuid(body.observationId),
            _reason: text(body.reason, 500),
          };
        } else if (
          action === "mergeCompanies" ||
          action === "mergeObservations"
        ) {
          rpc =
            action === "mergeCompanies"
              ? "merge_companies"
              : "merge_observations";
          args = {
            _from: uuid(body.from),
            _into: uuid(body.into),
            _reason: text(body.reason, 500),
          };
        } else throw Error("Unknown action.");
      }
    }
    const { data, error } = await client.rpc(rpc, args);
    if (error) {
      const message =
        error.code === "23505"
          ? "That username is already in use. Choose another."
          : error.code === "23514"
            ? "Check the required fields, username format and field lengths."
            : error.message;
      return json({ error: message }, error.code === "42501" ? 403 : 400);
    }
    return json({ result: data });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Request failed." },
      400,
    );
  }
}
