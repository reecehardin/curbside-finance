import { LogOut } from "lucide-react";
import SidebarNav from "./SidebarNav";
import { LogoLockup } from "./Logo";

export default function Sidebar({ email }: { email: string }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface/70 p-4 backdrop-blur">
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
    </aside>
  );
}
