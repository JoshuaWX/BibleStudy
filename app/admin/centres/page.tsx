import Image from "next/image";
import Link from "next/link";
import { Building2, LogOut } from "lucide-react";

import { signOut } from "@/app/admin/login/actions";
import { AdminNav } from "@/components/admin-nav";
import { CentreManager } from "@/components/centre-manager";
import { requireApprovedAdmin } from "@/lib/admin";
import { countCentreAllocations, type MemberAllocation, type WorshipCentre } from "@/lib/allocations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AdminCentresPage() {
  const user = await requireApprovedAdmin();
  const { centres, allocations } = await getCentreData();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fb] text-[#222636]">
      <div className="fixed inset-0 bg-[linear-gradient(115deg,#fbf1f6_0%,#f8f7ff_44%,#effbf8_100%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.62)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.58)_1px,transparent_1px)] bg-[size:56px_56px] opacity-45" />

      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#20233a] shadow-[0_14px_30px_rgba(32,35,58,0.18)]" aria-label="Back to member form"><Image src="/rccg-logo.png" alt="" width={32} height={32} className="object-contain" /></Link>
        <form action={signOut}><button type="submit" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-white/65 text-[#34384b] shadow-sm backdrop-blur transition hover:bg-white" title="Sign out" aria-label="Sign out"><LogOut className="h-4 w-4" /></button></form>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <AdminNav active="centres" />
        <div className="mb-5 rounded-lg border border-white/80 bg-white/82 p-4 shadow-[0_24px_80px_rgba(42,45,67,0.12)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-black uppercase text-[#8b90a3]">RUC Bible Study</p><h1 className="mt-2 text-3xl font-black leading-tight text-[#20233a] sm:text-5xl">Worship centres</h1><p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#74798a] sm:text-base">Add and rename centres, or archive them without disturbing existing member allocations.</p></div>
            <div className="inline-flex items-center gap-2 text-sm font-black text-[#6b7182]"><Building2 className="h-5 w-5 text-[#6d5df6]" />{user.email}</div>
          </div>
        </div>
        <CentreManager centres={countCentreAllocations(centres, allocations)} />
      </section>
    </main>
  );
}

async function getCentreData() {
  const supabase = createSupabaseAdminClient();
  const [centresResult, allocationsResult] = await Promise.all([
    supabase.from("worship_centres").select("*").order("is_active", { ascending: false }).order("name"),
    supabase.from("member_allocations").select("*").limit(5000)
  ]);
  if (centresResult.error) console.error("Worship centres fetch failed", centresResult.error);
  if (allocationsResult.error) console.error("Centre allocation counts fetch failed", allocationsResult.error);
  return { centres: (centresResult.data ?? []) as WorshipCentre[], allocations: (allocationsResult.data ?? []) as MemberAllocation[] };
}
