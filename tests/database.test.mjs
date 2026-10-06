import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
await db.exec(
  `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,email text unique,raw_app_meta_data jsonb,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;grant usage on schema storage to authenticated;grant select,insert,delete on storage.objects to authenticated;`,
);
await db.exec(
  readFileSync("supabase/migrations/202610060001_stage_1a.sql", "utf8"),
);
await db.exec(
  readFileSync(
    "supabase/migrations/202610060002_intervention_report.sql",
    "utf8",
  ),
);
const owner = "00000000-0000-4000-8000-000000000001",
  scout = "00000000-0000-4000-8000-000000000002",
  pending = "00000000-0000-4000-8000-000000000003";
for (const [id, email] of [
  [owner, "ola@example.com"],
  [scout, "sam@example.com"],
  [pending, "sam@other.example"],
])
  await db.query(
    `insert into auth.users values($1,$2,'{"provider":"google"}','{"full_name":"Example"}')`,
    [id, email],
  );
await db.exec(
  `update public.profiles set setup_complete=true,access_status='Approved',role='Admin',is_owner=true where id='${owner}';update public.profiles set setup_complete=true,access_status='Approved' where id='${scout}';`,
);
async function asUser(id, fn) {
  await db.exec(
    `set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`,
  );
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
}
let companyId, observationId;
async function submit(
  id,
  {
    domain = "across.to",
    name = "Across",
    source = "https://x.com/across/status/123?s=11",
    allow = false,
  } = {},
) {
  return asUser(id, async () => {
    const r = await db.query(
      `select public.submit_observation(null,$1,$2,'Protocol','Bounty','Announced a bounty','$20K','2026-10-06',$3,$4) result`,
      [name, domain, source, allow],
    );
    return r.rows[0].result;
  });
}
test("database isolates pending accounts and prevents role escalation", async () => {
  await asUser(pending, async () => {
    await db.query(
      `select public.save_profile('Sam','sam_pending','Admin',null)`,
    );
    const p = (await db.query("select * from public.profiles")).rows;
    assert.equal(p.length, 1);
    assert.equal(p[0].role, "Research Scout");
    assert.equal(p[0].access_status, "Pending");
    await assert.rejects(
      db.query(`update public.profiles set role='Admin' where id=$1`, [
        pending,
      ]),
      /permission denied/,
    );
    assert.equal(
      (await db.query("select * from public.companies")).rows.length,
      0,
    );
  });
  await assert.rejects(submit(pending), /Approved workspace access/);
});
test("verified actor and atomic source capture are enforced by PostgreSQL", async () => {
  const r = await submit(scout);
  companyId = r.company_id;
  observationId = r.observation_id;
  const obs = (
    await db.query("select * from public.observations where id=$1", [
      observationId,
    ])
  ).rows[0];
  assert.equal(obs.submitted_by, scout);
  assert.equal(
    (await db.query("select * from public.observation_sources")).rows.length,
    1,
  );
});
test("same company/source warns; explicit override and additional evidence are supported", async () => {
  const dup = await submit(owner, {
    source: "https://twitter.com/across/status/123?utm_source=test#fragment",
  });
  assert.equal(dup.duplicate_id, observationId);
  assert.equal(
    (await db.query("select * from public.observations")).rows.length,
    1,
  );
  const separate = await submit(owner, { allow: true });
  assert.ok(separate.observation_id);
  await asUser(owner, () =>
    db.query("select public.add_observation_source($1,$2)", [
      observationId,
      "https://superteam.example/bounty",
    ]),
  );
  assert.equal(
    (
      await db.query(
        "select * from public.observation_sources where observation_id=$1",
        [observationId],
      )
    ).rows.length,
    2,
  );
});
test("same-name companies with distinct domains remain distinct", async () => {
  const r = await submit(scout, { domain: "across.example" });
  assert.notEqual(r.company_id, companyId);
  assert.equal(
    (await db.query("select * from public.companies where name='Across'")).rows
      .length,
    2,
  );
});
test("workers cannot perform admin actions; owner cannot be demoted", async () => {
  await asUser(scout, () =>
    assert.rejects(
      db.query(`select public.review_access($1,'Admin','Approved')`, [scout]),
      /Admin access/,
    ),
  );
  await asUser(owner, () =>
    assert.rejects(
      db.query(`select public.review_access($1,'Research Scout','Suspended')`, [
        owner,
      ]),
      /Owner access is protected/,
    ),
  );
});
test("admin approves request without letting request change actual permissions", async () => {
  await asUser(owner, () =>
    db.query(`select public.review_access($1,'Analyst','Approved')`, [pending]),
  );
  assert.equal(
    (await db.query("select role from public.profiles where id=$1", [pending]))
      .rows[0].role,
    "Analyst",
  );
});
test("anonymous reads and RPC calls are rejected", async () => {
  await db.exec("set role anon;");
  try {
    await assert.rejects(
      db.query("select * from public.companies"),
      /permission denied/,
    );
    await assert.rejects(
      db.query(`select public.save_profile('Fake','fake','Admin',null)`),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role;");
  }
});
test("sources and observations merge while contributor IDs are preserved", async () => {
  const from = (
    await submit(owner, { source: "https://blog.example/across-bounty" })
  ).observation_id;
  await asUser(owner, () =>
    db.query("select public.merge_observations($1,$2,$3)", [
      from,
      observationId,
      "Same campaign confirmed",
    ]),
  );
  const source = (
    await db.query(
      "select * from public.observation_sources where url='https://blog.example/across-bounty'",
    )
  ).rows[0];
  assert.equal(source.observation_id, observationId);
  assert.equal(source.submitted_by, owner);
  assert.equal(
    (await db.query("select * from public.observations where id=$1", [from]))
      .rows[0].merged_into,
    observationId,
  );
});
test("usernames are distinct while account email is not worker-readable", async () => {
  const names = (
    await db.query("select username from public.profiles")
  ).rows.map((p) => p.username);
  assert.equal(new Set(names).size, names.length);
  await asUser(scout, () =>
    assert.rejects(
      db.query("select email from auth.users"),
      /permission denied/,
    ),
  );
});
test("invalid capture rolls back company creation and profile-image folders are isolated", async () => {
  const count = (await db.query("select count(*)::int n from public.companies"))
    .rows[0].n;
  await assert.rejects(
    submit(scout, {
      domain: "rollback.example",
      source: "javascript:alert(1)",
    }),
    /complete http/,
  );
  assert.equal(
    (await db.query("select count(*)::int n from public.companies")).rows[0].n,
    count,
  );
  await asUser(scout, async () => {
    await db.query(
      "insert into storage.objects(bucket_id,name) values('profile-images',$1)",
      [`${scout}/avatar.png`],
    );
    await assert.rejects(
      db.query(
        "insert into storage.objects(bucket_id,name) values('profile-images',$1)",
        [`${owner}/avatar.png`],
      ),
      /row-level security/,
    );
  });
});
test("merged company domains continue to resolve to canonical identity", async () => {
  const from = (
    await submit(scout, {
      domain: "alias.example",
      source: "https://news.example/alias",
    })
  ).company_id;
  await asUser(owner, () =>
    db.query("select public.merge_companies($1,$2,$3)", [
      from,
      companyId,
      "Confirmed same company",
    ]),
  );
  const next = await submit(scout, {
    domain: "alias.example",
    source: "https://news.example/new-event",
  });
  assert.equal(next.company_id, companyId);
});
test("suspension immediately removes shared read and write permission", async () => {
  await asUser(owner, () =>
    db.query("select public.review_access($1,'Research Scout','Suspended')", [
      scout,
    ]),
  );
  await asUser(scout, async () => {
    assert.equal(
      (await db.query("select * from public.companies")).rows.length,
      0,
    );
  });
  await assert.rejects(submit(scout), /Approved workspace access/);
});

async function contextSubmit({
  source = "https://report.example/bounty",
  basis = "Inferred",
  status = "Active",
  desired = "Development",
  user = owner,
} = {}) {
  return asUser(user, async () => {
    const r = await db.query(
      "select public.submit_intervention_observation(null,'Context Project','context.example','Protocol','Bounty','Developer bounty','$20K','2026-10-06',$1,false,'$20K',$2,$3,'2026-09-01',$4) result",
      [source, desired, basis, status],
    );
    return r.rows[0].result;
  });
}
test("intervention capture persists provenance and lifecycle while reusing existing identity and source authority", async () => {
  const r = await contextSubmit();
  const o = (
    await db.query("select * from public.observations where id=$1", [
      r.observation_id,
    ])
  ).rows[0];
  assert.equal(o.intent_basis, "Inferred");
  assert.equal(o.intervention_status, "Active");
  assert.equal(o.desired_behaviour, "Development");
  assert.equal(o.submitted_by, owner);
  assert.equal(o.started_on.toISOString().slice(0, 10), "2026-09-01");
  assert.equal(
    (
      await db.query("select status from public.companies where id=$1", [
        r.company_id,
      ])
    ).rows[0].status,
    "Saved",
  );
  const duplicate = await contextSubmit({ basis: "Declared", status: "Ended" });
  assert.equal(duplicate.duplicate_id, o.id);
  assert.equal(
    (
      await db.query(
        "select intent_basis,intervention_status from public.observations where id=$1",
        [o.id],
      )
    ).rows[0].intervention_status,
    "Active",
  );
});
test("invalid intervention context cannot create partial records or bypass database constraints", async () => {
  const before = (await db.query("select count(*) from public.observations"))
    .rows[0].count;
  await assert.rejects(
    contextSubmit({
      source: "https://report.example/invalid",
      basis: "Unknown",
    }),
    /Declared or Inferred/,
  );
  await assert.rejects(
    contextSubmit({
      source: "https://report.example/status",
      status: "Completed",
    }),
    /valid intervention status/,
  );
  assert.equal(
    (await db.query("select count(*) from public.observations")).rows[0].count,
    before,
  );
  await assert.rejects(
    db.query(
      "update public.observations set intent_basis='Unknown' where desired_behaviour<>''",
    ),
    /objective_requires_basis/,
  );
});
test("new intervention RPC retains anonymous and suspended account restrictions", async () => {
  await assert.rejects(
    contextSubmit({ user: scout, source: "https://report.example/suspended" }),
    /Approved workspace access/,
  );
  await db.exec("set role anon");
  try {
    await assert.rejects(
      db.query(
        "select public.submit_intervention_observation(null,'Hidden','hidden.example','Protocol','Bounty','A bounty','','2026-10-06','https://report.example/anonymous')",
      ),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});

test.after(() => db.close());
