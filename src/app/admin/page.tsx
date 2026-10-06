import { redirect } from "next/navigation";
import { configured } from "@/lib/supabase/config";
import { serverClient } from "@/lib/supabase/server";
import InternalWorkspace from "@/components/internal-workspace";
export const dynamic = "force-dynamic";
export default async function Admin() {
  if (!configured()) redirect("/sign-in");
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: p } = await client
    .from("profiles")
    .select("role,access_status,setup_complete")
    .eq("id", user.id)
    .single();
  if (
    p?.role !== "Admin" ||
    p.access_status !== "Approved" ||
    !p.setup_complete
  )
    redirect("/");
  return <InternalWorkspace admin />;
}
