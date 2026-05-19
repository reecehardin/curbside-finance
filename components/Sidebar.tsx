import SidebarNav from "./SidebarNav";

export default function Sidebar({ email }: { email: string }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface p-4">
      <div className="mb-7 flex items-center gap-2.5 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-lg font-black text-[#06210f]">
          C
        </div>
        <div className="font-bold leading-tight">
          Curbside
          <div className="text-xs font-normal text-muted">Finance</div>
        </div>
      </div>

      <SidebarNav />

      <div className="mt-auto border-t border-border pt-4">
        <div className="mb-2 truncate px-1 text-xs text-muted" title={email}>
          {email}
        </div>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
