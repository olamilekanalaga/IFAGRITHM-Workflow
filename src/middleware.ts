import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { configured, supabaseConfig } from "./lib/supabase/config";
export async function middleware(request: NextRequest) {
  if (!configured()) return NextResponse.next();
  let response = NextResponse.next({ request });
  const { url, key } = supabaseConfig();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        for (const { name, value } of values) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of values)
          response.cookies.set(name, value, options);
      },
    },
  });
  await client.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  runtime: "nodejs",
  matcher: ["/", "/admin/:path*", "/api/:path*", "/auth/:path*", "/sign-in"],
};
