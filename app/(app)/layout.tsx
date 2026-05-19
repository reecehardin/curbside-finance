import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already gates this, but guard again so `user` is never null.
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email ?? ""} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
