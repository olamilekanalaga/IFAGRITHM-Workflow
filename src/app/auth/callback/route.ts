import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { configured } from "@/lib/supabase/config";
export async function GET(request: NextRequest) {
  if (configured()) {
    const code = request.nextUrl.searchParams.get("code");
    if (code) {
      const client = await serverClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL("/", request.url));
    }
  }
  return NextResponse.redirect(new URL("/sign-in?error=callback", request.url));
}
