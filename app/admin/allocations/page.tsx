import Image from "next/image";
import Link from "next/link";
import { Download, LogOut, MapPinned } from "lucide-react";

import { signOut } from "@/app/admin/login/actions";
import { AdminNav } from "@/components/admin-nav";
import { AllocationManager } from "@/components/allocation-manager";
import { requireApprovedAdmin } from "@/lib/admin";
import {
  attachAllocations,
  type MemberAllocation,
  type WorshipCentre
} from "@/lib/allocations";
import type { MemberRecord } from "@/lib/members";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AdminAllocationsPage() {
  const user = await requireApprovedAdmin();
  const { members, allocations, centres } = await getAllocationData();
  const allocationMembers = attachAllocations(members, allocations, centres);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fb] text-[#222636]">
      <div className="fixed inset-0 bg-[linear-gradient(115deg,#fbf1f6_0%,#f8f7ff_44%,#effbf8_100%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.62)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.58)_1px,transparent_1px)] bg-[size:56px_56px] opacity-45" />

      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#20233a] shadow-[0_14px_30px_rgba(32,35,58,0.18)]" aria-label="Back to member form">
          <Image src="/rccg-logo.png" alt="" width={32} height={32} className="object-contain" />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/admin/export" className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/70 bg-white/65 px-3 text-sm font-bold text-[#34384b] shadow-sm backdrop-blur transition hover:bg-white">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Link>
          <form action={signOut}>
            <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-white/65 text-[#34384b] shadow-sm backdrop-blur transition hover:bg-white" title="Sign out" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <AdminNav active="allocations" />
        <div className="mb-5 rounded-lg border border-white/80 bg-white/82 p-4 shadow-[0_24px_80px_rgba(42,45,67,0.12)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-[#8b90a3]">RUC Bible Study</p>
              <h1 className="mt-2 text-3xl font-black leading-tight text-[#20233a] sm:text-5xl">Worship centre allocations</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#74798a] sm:text-base">Assign members individually or in groups, correct placements, and find unallocated members quickly.</p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-lg bg-[#f2f0ff] px-4 py-3 text-sm font-black text-[#514789]">
              <MapPinned className="h-5 w-5" />
              {user.email}
            </div>
          </div>
        </div>

        <AllocationManager members={allocationMembers} centres={centres} />
      </section>
    </main>
  );
}

async function getAllocationData() {
  const supabase = createSupabaseAdminClient();
  const [membersResult, allocationsResult, centresResult] = await Promise.all([
    supabase.from("members").select("*").order("submitted_at", { ascending: false }).limit(1000),
    supabase.from("member_allocations").select("*").limit(1000),
    supabase.from("worship_centres").select("*").order("is_active", { ascending: false }).order("name")
  ]);

  if (membersResult.error) console.error("Allocation members fetch failed", membersResult.error);
  if (allocationsResult.error) console.error("Allocations fetch failed", allocationsResult.error);
  if (centresResult.error) console.error("Worship centres fetch failed", centresResult.error);

  return {
    members: (membersResult.data ?? []) as MemberRecord[],
    allocations: (allocationsResult.data ?? []) as MemberAllocation[],
    centres: (centresResult.data ?? []) as WorshipCentre[]
  };
}
