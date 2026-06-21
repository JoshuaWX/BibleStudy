"use client";

import { CheckSquare2, Loader2, MapPin, Save, Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { assignMembers, unassignMembers } from "@/app/admin/allocations/actions";
import type { AdminActionResult, AllocationMember, WorshipCentre } from "@/lib/allocations";
import { memberDisplayName } from "@/lib/members";

type AllocationManagerProps = {
  members: AllocationMember[];
  centres: WorshipCentre[];
};

export function AllocationManager({ members, centres }: AllocationManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [centreFilter, setCentreFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCentreId, setBulkCentreId] = useState("");
  const [message, setMessage] = useState<AdminActionResult | null>(null);
  const [draftCentres, setDraftCentres] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((member) => [member.id, member.allocation?.centre_id ?? ""]))
  );

  const activeCentres = centres.filter((centre) => centre.is_active);
  const filteredMembers = useMemo(() => {
    const term = query.trim().toLowerCase();

    return members.filter((member) => {
      const matchesTerm =
        !term ||
        [
          memberDisplayName(member),
          member.matric_number,
          member.matric_number_key,
          member.department,
          member.level ?? "",
          member.bible_study_unit ?? "",
          member.allocation?.centre.name ?? ""
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "allocated" && member.allocation) ||
        (statusFilter === "unallocated" && !member.allocation);
      const matchesCentre =
        centreFilter === "all" || member.allocation?.centre_id === centreFilter;

      return Boolean(matchesTerm && matchesStatus && matchesCentre);
    });
  }, [centreFilter, members, query, statusFilter]);

  const allocatedCount = members.filter((member) => member.allocation).length;
  const visibleIds = filteredMembers.map((member) => member.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  function toggleMember(memberId: string) {
    setSelectedIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
  }

  function toggleVisible() {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return Array.from(new Set([...current, ...visibleIds]));
    });
  }

  function execute(
    action: () => Promise<AdminActionResult>,
    onSuccess?: () => void
  ) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      setMessage(result);

      if (result.ok) {
        onSuccess?.();
        router.refresh();
      }
    });
  }

  function assignSelected() {
    execute(
      () => assignMembers({ memberIds: selectedIds, centreId: bulkCentreId }),
      () => {
        setDraftCentres((current) => ({
          ...current,
          ...Object.fromEntries(selectedIds.map((id) => [id, bulkCentreId]))
        }));
        setSelectedIds([]);
      }
    );
  }

  function unassignSelected() {
    execute(
      () => unassignMembers({ memberIds: selectedIds }),
      () => {
        setDraftCentres((current) => ({
          ...current,
          ...Object.fromEntries(selectedIds.map((id) => [id, ""]))
        }));
        setSelectedIds([]);
      }
    );
  }

  function assignOne(memberId: string) {
    const centreId = draftCentres[memberId] ?? "";
    execute(() => assignMembers({ memberIds: [memberId], centreId }));
  }

  function unassignOne(memberId: string) {
    execute(
      () => unassignMembers({ memberIds: [memberId] }),
      () => setDraftCentres((current) => ({ ...current, [memberId]: "" }))
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Total members" value={members.length} />
        <Metric label="Allocated" value={allocatedCount} tone="success" />
        <Metric label="Unallocated" value={members.length - allocatedCount} tone="warning" />
      </div>

      <div className="grid gap-3 rounded-lg border border-white/80 bg-white/82 p-4 shadow-[0_18px_60px_rgba(42,45,67,0.10)] backdrop-blur-xl md:grid-cols-3">
        <label className="relative block">
          <span className="sr-only">Search members</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b90a3]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-lg border border-[#e0e3ea] bg-white py-2 pl-10 pr-3 text-sm font-bold text-[#252a3a] outline-none placeholder:text-[#9aa0af] focus:border-[#7a67ff] focus:ring-4 focus:ring-[#725cff]/10"
            placeholder="Search name, matric, department, unit, centre"
          />
        </label>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-12 rounded-lg border border-[#e0e3ea] bg-white px-3 text-sm font-bold text-[#252a3a] outline-none focus:border-[#7a67ff] focus:ring-4 focus:ring-[#725cff]/10"
          aria-label="Filter by allocation status"
        >
          <option value="all">All allocation statuses</option>
          <option value="allocated">Allocated</option>
          <option value="unallocated">Unallocated</option>
        </select>
        <select
          value={centreFilter}
          onChange={(event) => setCentreFilter(event.target.value)}
          className="h-12 rounded-lg border border-[#e0e3ea] bg-white px-3 text-sm font-bold text-[#252a3a] outline-none focus:border-[#7a67ff] focus:ring-4 focus:ring-[#725cff]/10"
          aria-label="Filter by worship centre"
        >
          <option value="all">All worship centres</option>
          {centres.map((centre) => (
            <option key={centre.id} value={centre.id}>
              {centre.name}{centre.is_active ? "" : " (Archived)"}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 rounded-lg border border-[#dedaf8] bg-[#f7f5ff] p-4 lg:grid-cols-[auto_1fr_auto_auto] lg:items-center">
        <div className="inline-flex items-center gap-2 text-sm font-black text-[#4e476f]">
          <CheckSquare2 className="h-4 w-4" />
          {selectedIds.length} selected
        </div>
        <select
          value={bulkCentreId}
          onChange={(event) => setBulkCentreId(event.target.value)}
          className="h-11 min-w-0 rounded-lg border border-[#dcd7f5] bg-white px-3 text-sm font-bold text-[#252a3a] outline-none focus:border-[#7a67ff] focus:ring-4 focus:ring-[#725cff]/10"
          aria-label="Worship centre for selected members"
        >
          <option value="">Choose centre for selected members</option>
          {activeCentres.map((centre) => (
            <option key={centre.id} value={centre.id}>{centre.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={assignSelected}
          disabled={isPending || !selectedIds.length || !bulkCentreId}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#6d5df6] px-4 text-sm font-black text-white transition hover:bg-[#5c4bee] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
          Assign
        </button>
        <button
          type="button"
          onClick={unassignSelected}
          disabled={isPending || !selectedIds.length}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#dcd7f5] bg-white px-4 text-sm font-black text-[#5f587c] transition hover:border-[#bbb2ee] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          Unassign
        </button>
      </div>

      {message ? <ActionMessage result={message} /> : null}

      {filteredMembers.length ? (
        <>
          <div className="grid gap-3 lg:hidden">
            {filteredMembers.map((member) => (
              <article key={member.id} className="rounded-lg border border-white/80 bg-white/82 p-4 shadow-[0_14px_40px_rgba(42,45,67,0.08)] backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="mt-1 h-4 w-4 accent-[#6d5df6]"
                    aria-label={`Select ${memberDisplayName(member)}`}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-black text-[#20233a]">{memberDisplayName(member)}</h2>
                    <p className="mt-1 text-sm font-bold text-[#74798a]">{member.matric_number}</p>
                    <p className="mt-3 text-xs font-black uppercase text-[#9aa0af]">Current allocation</p>
                    <p className="mt-1 text-sm font-black text-[#4f466f]">
                      {member.allocation?.centre.name ?? "Unallocated"}
                    </p>
                  </div>
                </div>
                <MemberAllocationControls
                  member={member}
                  centres={activeCentres}
                  draftCentreId={draftCentres[member.id] ?? ""}
                  isPending={isPending}
                  onDraftChange={(centreId) => setDraftCentres((current) => ({ ...current, [member.id]: centreId }))}
                  onSave={() => assignOne(member.id)}
                  onUnassign={() => unassignOne(member.id)}
                />
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-lg border border-white/80 bg-white/82 shadow-[0_18px_60px_rgba(42,45,67,0.10)] backdrop-blur-xl lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead className="bg-[#f6f7fb] text-xs font-black uppercase text-[#7c8295]">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} className="h-4 w-4 accent-[#6d5df6]" aria-label="Select all visible members" />
                    </th>
                    <th className="px-4 py-3">Member</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Current centre</th>
                    <th className="px-4 py-3">Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8eaf0]">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="align-middle transition hover:bg-[#f8f8fc]">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(member.id)} onChange={() => toggleMember(member.id)} className="h-4 w-4 accent-[#6d5df6]" aria-label={`Select ${memberDisplayName(member)}`} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-black text-[#20233a]">{memberDisplayName(member)}</p>
                        <p className="mt-1 text-xs font-bold text-[#858a9b]">{member.matric_number}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#5f6678]">{member.department}</td>
                      <td className="px-4 py-3 font-semibold text-[#5f6678]">{member.level ?? "Not recorded"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${member.allocation ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                          {member.allocation?.centre.name ?? "Unallocated"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <MemberAllocationControls
                          member={member}
                          centres={activeCentres}
                          draftCentreId={draftCentres[member.id] ?? ""}
                          isPending={isPending}
                          onDraftChange={(centreId) => setDraftCentres((current) => ({ ...current, [member.id]: centreId }))}
                          onSave={() => assignOne(member.id)}
                          onUnassign={() => unassignOne(member.id)}
                          compact
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-white/80 bg-white/82 px-4 py-16 text-center shadow-[0_18px_60px_rgba(42,45,67,0.10)] backdrop-blur-xl">
          <p className="text-lg font-black text-[#20233a]">No members match these filters</p>
          <p className="mt-2 text-sm font-bold text-[#74798a]">Adjust the search, centre, or allocation status.</p>
        </div>
      )}

      <p className="text-sm font-bold text-[#858a9b]">{filteredMembers.length} member{filteredMembers.length === 1 ? "" : "s"} shown</p>
    </div>
  );
}

function MemberAllocationControls({
  member,
  centres,
  draftCentreId,
  isPending,
  onDraftChange,
  onSave,
  onUnassign,
  compact = false
}: {
  member: AllocationMember;
  centres: WorshipCentre[];
  draftCentreId: string;
  isPending: boolean;
  onDraftChange: (centreId: string) => void;
  onSave: () => void;
  onUnassign: () => void;
  compact?: boolean;
}) {
  const archivedCurrent = member.allocation && !member.allocation.centre.is_active;

  return (
    <div className={`${compact ? "flex min-w-[390px] items-center" : "mt-4 grid"} gap-2`}>
      <select
        value={draftCentreId}
        onChange={(event) => onDraftChange(event.target.value)}
        className="h-10 min-w-0 flex-1 rounded-lg border border-[#e0e3ea] bg-white px-3 text-sm font-bold text-[#34384b] outline-none focus:border-[#7a67ff] focus:ring-4 focus:ring-[#725cff]/10"
        aria-label={`Worship centre for ${memberDisplayName(member)}`}
      >
        <option value="">Choose centre</option>
        {archivedCurrent ? (
          <option value={member.allocation!.centre_id}>{member.allocation!.centre.name} (Archived)</option>
        ) : null}
        {centres.map((centre) => <option key={centre.id} value={centre.id}>{centre.name}</option>)}
      </select>
      <button type="button" onClick={onSave} disabled={isPending || !draftCentreId} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6d5df6] px-3 text-sm font-black text-white transition hover:bg-[#5c4bee] disabled:cursor-not-allowed disabled:opacity-50" title="Save allocation">
        <Save className="h-4 w-4" />
        {compact ? <span className="sr-only">Save</span> : "Save"}
      </button>
      <button type="button" onClick={onUnassign} disabled={isPending || !member.allocation} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#e0e3ea] bg-white px-3 text-sm font-black text-[#6b7182] transition hover:border-red-200 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40" title="Remove allocation">
        <Trash2 className="h-4 w-4" />
        {compact ? <span className="sr-only">Unassign</span> : "Unassign"}
      </button>
    </div>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number; tone?: "default" | "success" | "warning" }) {
  const valueClass = tone === "success" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : "text-[#20233a]";
  return (
    <div className="rounded-lg border border-white/80 bg-white/82 p-4 shadow-[0_14px_40px_rgba(42,45,67,0.08)] backdrop-blur-xl">
      <p className="text-xs font-black uppercase text-[#8b90a3]">{label}</p>
      <p className={`mt-2 text-3xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function ActionMessage({ result }: { result: AdminActionResult }) {
  return (
    <div role="status" className={`rounded-lg border px-4 py-3 text-sm font-bold ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
      {result.message}
    </div>
  );
}
