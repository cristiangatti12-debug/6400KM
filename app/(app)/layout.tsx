import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BottomTabBar from "@/components/BottomTabBar";
import styles from "./shell.module.css";

// The shell wrapped around every logged-in screen.
// If somehow a signed-out visitor reaches here, send them to login.
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
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className={styles.brand}>6400KM</span>
        <form action="/auth/signout" method="post">
          <button className={styles.signout} type="submit">
            Log out
          </button>
        </form>
      </header>

      <main className={styles.content}>{children}</main>

      <BottomTabBar />
    </div>
  );
}
