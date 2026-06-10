"use client";

import { ArrowUpRight, Loader2 } from "lucide-react";
import { useActionState } from "react";

import { signIn, type LoginState } from "@/app/admin/login/actions";

const initialState: LoginState = {
  message: ""
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <label className="block">
        <span className="field-label">Email</span>
        <input
          className="field-input"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
          required
        />
      </label>

      <label className="block">
        <span className="field-label">Password</span>
        <input
          className="field-input"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter password"
          required
        />
      </label>

      {state.message ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#6d5df6] px-6 text-base font-black text-white shadow-[0_12px_28px_rgba(109,93,246,0.24)] transition hover:bg-[#5c4bee] focus:outline-none focus:ring-4 focus:ring-[#725cff]/20 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign in
        {!isPending ? <ArrowUpRight className="ml-2 h-4 w-4" /> : null}
      </button>
    </form>
  );
}
