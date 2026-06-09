import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Download, LogOut, Search, UsersRound } from "lucide-react";

import { signOut } from "@/app/admin/login/actions";
import { requireApprovedAdmin } from "@/lib/admin";
import { GENDERS, TRAINING_STATUSES, isGender, isTrainingStatus } from "@/lib/constants";
import { memberDisplayName, type MemberRecord } from "@/lib/members";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminPageProps = {
  searchParams: {
    q?: string;
    status?: string;
    gender?: string;
  };
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const user = await requireApprovedAdmin();
  const members = await getMembers(searchParams);
  const exportHref = `/admin/export?${new URLSearchParams(cleanFilters(searchParams)).toString()}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fb] text-[#222636]">
      <div className="fixed inset-0 bg-[linear-gradient(115deg,#fbf1f6_0%,#f8f7ff_44%,#effbf8_100%)]" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.62)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.58)_1px,transparent_1px)] bg-[size:56px_56px] opacity-45" />

      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#20233a] shadow-[0_14px_30px_rgba(32,35,58,0.18)]"
          aria-label="Back to member form"
        >
          <Image src="/rccg-logo.png" alt="" width={32} height={32} className="object-contain" />
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={exportHref}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/70 bg-white/65 px-3 text-sm font-bold text-[#34384b] shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#6d5df6]/15"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/70 bg-white/65 text-[#34384b] shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#6d5df6]/15"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <div className="mb-5 rounded-lg border border-white/80 bg-white/82 p-4 shadow-[0_24px_80px_rgba(42,45,67,0.12)] backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-[#e8eaf0] pb-5">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full bg-[#ff6661]" />
              <span className="h-3.5 w-3.5 rounded-full bg-[#ffc247]" />
              <span className="h-3.5 w-3.5 rounded-full bg-[#58cf61]" />
            </div>
            <p className="max-w-[170px] truncate text-xs font-black uppercase text-[#8b90a3] sm:max-w-none">
              {user.email}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase text-[#8b90a3]">RUC Bible Study</p>
              <h1 className="mt-2 text-3xl font-black leading-tight text-[#20233a] sm:text-5xl">
                Member records
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#74798a] sm:text-base">
                Search, filter, and export submitted member details. Public visitors cannot read
                these records.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-[#f5f6fb] px-4 py-3 text-sm font-black text-[#34384b]">
              <UsersRound className="h-5 w-5 text-[#6d5df6]" />
              {members.length} shown
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Total shown" value={members.length.toString()} />
          <Metric
            label="Teachers"
            value={members.filter((member) => member.training_class_status === "Teacher").length.toString()}
          />
          <Metric
            label="Training classes"
            value={
              members.filter((member) =>
                ["In Workers in training class", "In baptismal class", "In Believers class"].includes(
                  member.training_class_status
                )
              ).length.toString()
            }
          />
          <Metric
            label="Departments"
            value={new Set(members.map((member) => member.department.toLowerCase())).size.toString()}
          />
        </div>

        <form className="mb-5 grid gap-3 rounded-lg border border-white/80 bg-white/82 p-4 shadow-[0_18px_60px_rgba(42,45,67,0.10)] backdrop-blur-xl md:grid-cols-[1fr_220px_180px_auto]">
          <label className="relative block">
            <span className="sr-only">Search records</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b90a3]" />
            <input
              name="q"
              defaultValue={searchParams.q ?? ""}
              className="h-12 w-full rounded-lg border border-[#e0e3ea] bg-white py-2 pl-10 pr-3 text-sm font-bold text-[#252a3a] shadow-[0_5px_16px_rgba(25,29,45,0.05)] outline-none placeholder:text-[#9aa0af] focus:border-[#7a67ff] focus:ring-4 focus:ring-[#725cff]/10"
              placeholder="Search name, matric, phone, department"
            />
          </label>

          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="h-12 rounded-lg border border-[#e0e3ea] bg-white px-3 text-sm font-bold text-[#252a3a] shadow-[0_5px_16px_rgba(25,29,45,0.05)] outline-none focus:border-[#7a67ff] focus:ring-4 focus:ring-[#725cff]/10"
          >
            <option value="">All statuses</option>
            {TRAINING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            name="gender"
            defaultValue={searchParams.gender ?? ""}
            className="h-12 rounded-lg border border-[#e0e3ea] bg-white px-3 text-sm font-bold text-[#252a3a] shadow-[0_5px_16px_rgba(25,29,45,0.05)] outline-none focus:border-[#7a67ff] focus:ring-4 focus:ring-[#725cff]/10"
          >
            <option value="">All genders</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="h-12 rounded-lg bg-[#6d5df6] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(109,93,246,0.22)] transition hover:bg-[#5c4bee] focus:outline-none focus:ring-4 focus:ring-[#725cff]/20"
          >
            Apply
          </button>
        </form>

        {members.length ? (
          <>
            <div className="grid gap-3 lg:hidden">
              {members.map((member) => (
                <MobileMemberCard key={member.id} member={member} />
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-lg border border-white/80 bg-white/82 shadow-[0_18px_60px_rgba(42,45,67,0.10)] backdrop-blur-xl lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
                  <thead className="bg-[#f6f7fb] text-xs font-black uppercase text-[#7c8295]">
                    <tr>
                      <Th>Name</Th>
                      <Th>Matric</Th>
                      <Th>Phone</Th>
                      <Th>Department</Th>
                      <Th>Birthday</Th>
                      <Th>Gender</Th>
                      <Th>Status</Th>
                      <Th>Submitted</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8eaf0]">
                    {members.map((member) => (
                      <tr key={member.id} className="align-top transition hover:bg-[#f8f8fc]">
                        <Td strong>{memberDisplayName(member)}</Td>
                        <Td>{member.matric_number}</Td>
                        <Td>{member.phone_number_key}</Td>
                        <Td>{member.department}</Td>
                        <Td>{formatDate(member.birthday)}</Td>
                        <Td>{member.gender}</Td>
                        <Td>
                          {member.training_class_status}
                          {member.training_class_other ? `: ${member.training_class_other}` : ""}
                        </Td>
                        <Td>{formatDateTime(member.submitted_at)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-white/80 bg-white/82 px-4 py-16 text-center shadow-[0_18px_60px_rgba(42,45,67,0.10)] backdrop-blur-xl">
            <p className="text-lg font-black text-[#20233a]">No records found</p>
            <p className="mt-2 text-sm font-bold text-[#74798a]">Try adjusting the search or filters.</p>
          </div>
        )}
      </section>
    </main>
  );
}

async function getMembers(filters: AdminPageProps["searchParams"]) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("members")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(1000);

  if (filters.status && isTrainingStatus(filters.status)) {
    query = query.eq("training_class_status", filters.status);
  }

  if (filters.gender && isGender(filters.gender)) {
    query = query.eq("gender", filters.gender);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Admin members fetch failed", error);
    return [];
  }

  const members = (data ?? []) as MemberRecord[];
  const term = filters.q?.trim().toLowerCase();

  if (!term) {
    return members;
  }

  return members.filter((member) =>
    [
      member.surname,
      member.other_names,
      member.department,
      member.phone_number,
      member.phone_number_key,
      member.matric_number,
      member.matric_number_key,
      member.training_class_status,
      member.training_class_other ?? ""
    ]
      .join(" ")
      .toLowerCase()
      .includes(term)
  );
}

function cleanFilters(filters: AdminPageProps["searchParams"]) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => typeof value === "string" && value.trim())
  ) as Record<string, string>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/82 p-4 shadow-[0_14px_40px_rgba(42,45,67,0.08)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase text-[#8b90a3]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#20233a]">{value}</p>
    </div>
  );
}

function MobileMemberCard({ member }: { member: MemberRecord }) {
  return (
    <article className="rounded-lg border border-white/80 bg-white/82 p-4 shadow-[0_14px_40px_rgba(42,45,67,0.08)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black leading-tight text-[#20233a]">{memberDisplayName(member)}</h2>
          <p className="mt-1 text-sm font-bold text-[#74798a]">{member.matric_number}</p>
        </div>
        <span className="rounded-full bg-[#f2f0ff] px-3 py-1 text-xs font-black text-[#6d5df6]">
          {member.gender}
        </span>
      </div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <CardLine label="Phone" value={member.phone_number_key} />
        <CardLine label="Department" value={member.department} />
        <CardLine label="Birthday" value={formatDate(member.birthday)} />
        <CardLine
          label="Status"
          value={`${member.training_class_status}${member.training_class_other ? `: ${member.training_class_other}` : ""}`}
        />
      </div>
      <p className="mt-4 border-t border-[#e8eaf0] pt-3 text-xs font-bold text-[#8b90a3]">
        Submitted {formatDateTime(member.submitted_at)}
      </p>
    </article>
  );
}

function CardLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-[#9aa0af]">{label}</p>
      <p className="mt-1 font-bold leading-5 text-[#34384b]">{value}</p>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}

function Td({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <td className={`px-4 py-3 leading-6 ${strong ? "font-black text-[#20233a]" : "font-semibold text-[#5f6678]"}`}>
      {children}
    </td>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value}T00:00:00`)
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
