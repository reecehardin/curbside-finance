"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Settings,
  type LucideIcon,
} from "lucide-react";

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: ArrowDownLeft },
  { href: "/expenses", label: "Expenses", icon: ArrowUpRight },
  { href: "/monthly", label: "Monthly", icon: CalendarClock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5
              text-sm font-medium transition-all ${
                active
                  ? "bg-primary/10 text-primary-bright"
                  : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-primary shadow-glow-blue" />
            )}
            <Icon
              size={18}
              className={
                active ? "" : "text-muted-2 group-hover:text-text"
              }
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
