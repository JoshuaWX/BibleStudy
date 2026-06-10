import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

import { FloatingWindow } from "@/components/floating-window";
import { LoginForm } from "@/components/login-form";
import { getAdminEmails } from "@/lib/admin";

export default function AdminLoginPage() {
  const hasAdminEmails = getAdminEmails().length > 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fb] text-[#222636]">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#fbf1f6_0%,#f8f7ff_44%,#effbf8_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.62)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.58)_1px,transparent_1px)] bg-[size:56px_56px] opacity-45" />

      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#20233a] shadow-[0_14px_30px_rgba(32,35,58,0.18)]"
          aria-label="Back to member form"
        >
          <Image src="/rccg-logo.png" alt="" width={32} height={32} className="object-contain" />
        </Link>

        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/70 bg-white/65 px-3 text-sm font-bold text-[#34384b] shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#6d5df6]/15"
        >
          <ArrowLeft className="h-4 w-4" />
          Form
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-5xl items-center justify-center px-4 pb-12 pt-6 sm:px-6">
        <FloatingWindow ariaLabel="admin sign in" size="login">
          <div className="mb-7 flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f2f0ff] text-[#6d5df6] ring-1 ring-[#e7e3ff]">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-[#8b90a3]">Restricted access</p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-[#20233a]">
                Admin sign in
              </h1>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#74798a]">
                Use an approved Supabase Auth account to manage Bible Study member records.
              </p>
            </div>
          </div>

          {!hasAdminEmails ? (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
              Add <span className="font-black">ADMIN_EMAILS</span> to the server environment before
              dashboard access is granted.
            </div>
          ) : null}

          <LoginForm />
        </FloatingWindow>
      </section>
    </main>
  );
}
