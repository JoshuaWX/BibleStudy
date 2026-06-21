"use client";

import { Archive, Building2, Loader2, Pencil, Plus, RotateCcw, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createCentre, renameCentre, setCentreActive } from "@/app/admin/centres/actions";
import type { AdminActionResult, CentreWithCount } from "@/lib/allocations";

export function CentreManager({ centres }: { centres: CentreWithCount[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [message, setMessage] = useState<AdminActionResult | null>(null);

  function execute(action: () => Promise<AdminActionResult>, onSuccess?: () => void) {
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

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    execute(() => createCentre(newName), () => setNewName(""));
  }

  function beginEdit(centre: CentreWithCount) {
    setEditingId(centre.id);
    setEditName(centre.name);
    setMessage(null);
  }

  function saveEdit(centreId: string) {
    execute(() => renameCentre(centreId, editName), () => setEditingId(null));
  }

  function changeStatus(centre: CentreWithCount) {
    if (centre.is_active) {
      const confirmed = window.confirm(
        `${centre.name} will be hidden from new assignments. Existing allocations will remain visible. Archive it?`
      );
      if (!confirmed) return;
    }

    execute(() => setCentreActive(centre.id, !centre.is_active));
  }

  const activeCount = centres.filter((centre) => centre.is_active).length;
  const allocationCount = centres.reduce((total, centre) => total + centre.allocation_count, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Total centres" value={centres.length} />
        <Metric label="Active centres" value={activeCount} />
        <Metric label="Allocated members" value={allocationCount} />
      </div>

      <form onSubmit={handleCreate} className="grid gap-3 rounded-lg border border-white/80 bg-white/82 p-4 shadow-[0_18px_60px_rgba(42,45,67,0.10)] backdrop-blur-xl sm:grid-cols-[1fr_auto] sm:items-end">
        <label>
          <span className="text-sm font-black text-[#626a7c]">Add worship centre</span>
          <input value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={100} className="mt-2 h-12 w-full rounded-lg border border-[#e0e3ea] bg-white px-4 text-sm font-bold text-[#252a3a] outline-none placeholder:text-[#9aa0af] focus:border-[#7a67ff] focus:ring-4 focus:ring-[#725cff]/10" placeholder="Enter centre name" />
        </label>
        <button type="submit" disabled={isPending || !newName.trim()} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#6d5df6] px-5 text-sm font-black text-white transition hover:bg-[#5c4bee] disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add centre
        </button>
      </form>

      {message ? <div role="status" className={`rounded-lg border px-4 py-3 text-sm font-bold ${message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{message.message}</div> : null}

      <div className="overflow-hidden rounded-lg border border-white/80 bg-white/82 shadow-[0_18px_60px_rgba(42,45,67,0.10)] backdrop-blur-xl">
        <div className="divide-y divide-[#e8eaf0]">
          {centres.map((centre) => (
            <div key={centre.id} className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                {editingId === centre.id ? (
                  <input value={editName} onChange={(event) => setEditName(event.target.value)} maxLength={100} className="h-11 w-full max-w-lg rounded-lg border border-[#7a67ff] bg-white px-3 text-sm font-black text-[#252a3a] outline-none ring-4 ring-[#725cff]/10" autoFocus />
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <Building2 className="h-5 w-5 text-[#6d5df6]" />
                    <h2 className="text-base font-black text-[#20233a]">{centre.name}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-black ${centre.is_active ? "bg-emerald-50 text-emerald-800" : "bg-[#eef0f5] text-[#73798a]"}`}>{centre.is_active ? "Active" : "Archived"}</span>
                  </div>
                )}
                <p className="mt-2 text-sm font-bold text-[#7b8192]">{centre.allocation_count} allocated member{centre.allocation_count === 1 ? "" : "s"}</p>
              </div>
              <div className="flex items-center gap-2">
                {editingId === centre.id ? (
                  <>
                    <button type="button" onClick={() => saveEdit(centre.id)} disabled={isPending || !editName.trim()} className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6d5df6] text-white disabled:opacity-50" title="Save centre name" aria-label={`Save ${centre.name} name`}><Save className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setEditingId(null)} disabled={isPending} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e0e3ea] bg-white text-[#5f6678]" title="Cancel editing" aria-label="Cancel editing"><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => beginEdit(centre)} disabled={isPending} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e0e3ea] bg-white text-[#5f6678] transition hover:border-[#c8c3ef] hover:text-[#6d5df6]" title="Rename centre" aria-label={`Rename ${centre.name}`}><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => changeStatus(centre)} disabled={isPending} className={`flex h-10 w-10 items-center justify-center rounded-lg border bg-white transition ${centre.is_active ? "border-[#e0e3ea] text-[#5f6678] hover:border-amber-200 hover:text-amber-700" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`} title={centre.is_active ? "Archive centre" : "Restore centre"} aria-label={`${centre.is_active ? "Archive" : "Restore"} ${centre.name}`}>
                      {centre.is_active ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {!centres.length ? <div className="px-4 py-14 text-center text-sm font-bold text-[#74798a]">No worship centres have been added.</div> : null}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-white/80 bg-white/82 p-4 shadow-[0_14px_40px_rgba(42,45,67,0.08)] backdrop-blur-xl"><p className="text-xs font-black uppercase text-[#8b90a3]">{label}</p><p className="mt-2 text-3xl font-black text-[#20233a]">{value}</p></div>;
}
