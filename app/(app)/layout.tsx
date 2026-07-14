import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomTabBar from "@/components/BottomTabBar";
import { Logo } from "@/components/Logo";
import { Avatar } from "@/components/Avatar";

// The shell wrapped around every logged-in screen.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, profile_photos")
    .eq("id", user.id)
    .maybeSingle<{ display_name: string | null; profile_photos: string[] }>();

  const name = profile?.display_name || user.email?.split("@")[0] || "You";
  const photo = profile?.profile_photos?.[0] ?? null;

  return (
    <div className="min-h-[100dvh] mx-auto max-w-[600px] bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
        <Link href="/feed" aria-label="Home">
          <Logo markClassName="h-7 w-7" className="text-lg" />
        </Link>
        <Link href="/profile" aria-label="Your profile">
          <Avatar
            src={photo}
            name={name}
            className="w-9 text-sm ring-1 ring-border"
          />
        </Link>
      </header>

      <main className="px-4 pt-5 pb-[calc(88px+env(safe-area-inset-bottom))]">
        {children}
      </main>

      <BottomTabBar />
    </div>
  );
}
