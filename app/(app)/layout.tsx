import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import BottomTabBar from "@/components/BottomTabBar";
import { Logo } from "@/components/Logo";

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

  return (
    <div className="min-h-[100dvh] mx-auto max-w-[600px] bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur">
        <Logo markClassName="h-7 w-7" className="text-lg" />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground hover:border-muted-foreground/40"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </form>
      </header>

      <main className="px-4 pt-5 pb-[calc(88px+env(safe-area-inset-bottom))]">
        {children}
      </main>

      <BottomTabBar />
    </div>
  );
}
