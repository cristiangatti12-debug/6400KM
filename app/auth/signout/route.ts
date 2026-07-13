import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Logs the current user out, then returns them to the login page.
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
