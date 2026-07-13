"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Images, Map, MapPin, MessageCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/feed", label: "Feed", icon: Images },
  { href: "/itineraries", label: "Itineraries", icon: Map },
  { href: "/trips", label: "Trips", icon: MapPin },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[600px] border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className="h-6 w-6"
                strokeWidth={active ? 2.4 : 2}
                aria-hidden="true"
              />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
