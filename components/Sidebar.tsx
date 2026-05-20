"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import SidebarNav from "./SidebarNav";
import { LogoLockup } from "./Logo";

export default function Sidebar({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when the drawer is open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const panel = (
    <>
      <div className="mb-8 px-1 pt-2">
        <LogoLockup />
      </div>

      <SidebarNav />

      <div className="mt-auto border-t border-border pt-4">
        <div
          className="mb-2 truncate px-1 text-xs text-muted-2"
          title={email}
        >
          {email}
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5
              text-sm font-medium text-muted transition-colors
              hover:bg-surface-2 hover:text-expense"
          >
            <LogOut size={18} className="text-muted-2" />
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between
          border-b border-border bg-surface/85 px-4 py-3 backdrop-blur lg:hidden"
      >
        <LogoLockup size={32} />
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg
            border border-border bg-surface text-muted transition-colors
            hover:bg-surface-2 hover:text-text"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside
        className="hidden w-64 shrink-0 flex-col border-r border-border
          bg-surface/70 p-4 backdrop-blur lg:flex"
      >
        {panel}
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col
            border-r border-border bg-surface p-4 shadow-2xl transition-transform
            ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center
              justify-center rounded-lg text-muted transition-colors
              hover:bg-surface-2 hover:text-text"
          >
            <X size={20} />
          </button>
          {panel}
        </aside>
      </div>
    </>
  );
}
