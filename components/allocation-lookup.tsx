"use client";

import { AlertCircle, ArrowUpRight, Loader2, MapPinned, Search } from "lucide-react";
import { useState } from "react";

type LookupResult = {
  ok: boolean;
  allocated: boolean;
  message: string;
  centre?: string;
};

export function AllocationLookup() {
  const [matricNumber, setMatricNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/allocations/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricNumber }),
        cache: "no-store"
      });
      const body = (await response.json()) as LookupResult;
      setResult(body);
    } catch {
      setResult({
        ok: false,
        allocated: false,
        message: "We could not check allocations right now. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <label className="block">
        <span className="field-label">Matric Number</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-[calc(50%+4px)] h-4 w-4 -translate-y-1/2 text-[#9298a8]" />
          <input
            value={matricNumber}
            onChange={(event) => {
              setMatricNumber(event.target.value);
              setResult(null);
            }}
            className="field-input pl-11 uppercase"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="e.g. RUN/CMP/23/12345"
            required
          />
        </div>
      </label>

      {result?.allocated && result.centre ? (
        <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm"><MapPinned className="h-5 w-5" /></div>
            <div>
              <p className="text-xs font-black uppercase text-emerald-700">Your worship centre</p>
              <h2 className="mt-1 text-2xl font-black leading-tight">{result.centre}</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-emerald-800">Please attend Bible Study at this centre.</p>
            </div>
          </div>
        </div>
      ) : null}

      {result && !result.allocated ? (
        <div role="status" className={`rounded-2xl border px-4 py-3 text-sm font-bold ${result.ok ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"}`}>
          <div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{result.message}</span></div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !matricNumber.trim()}
        className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#6d5df6] px-6 text-base font-black text-white shadow-[0_12px_28px_rgba(109,93,246,0.24)] transition hover:bg-[#5c4bee] focus:outline-none focus:ring-4 focus:ring-[#725cff]/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Check allocation
        {!isSubmitting ? <ArrowUpRight className="ml-2 h-4 w-4" /> : null}
      </button>
    </form>
  );
}
