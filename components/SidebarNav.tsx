"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/income", label: "Income", icon: "↓" },
  { href: "/expenses", label: "Expenses", icon: "↑" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-accent/15 font-semibold text-accent-soft"
                : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            <span className="w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
