import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The home page just decides where to send you:
// logged in  -> the app (Feed tab)
// logged out -> the login page
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/feed");
  } else {
    redirect("/login");
  }
}
