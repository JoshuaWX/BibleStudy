import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

import { FloatingWindow } from "@/components/floating-window";
import { MemberForm } from "@/components/member-form";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8fb] text-[#222636]">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,#fbf1f6_0%,#f8f7ff_44%,#effbf8_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.62)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.58)_1px,transparent_1px)] bg-[size:56px_56px] opacity-45" />

      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#20233a] shadow-[0_14px_30px_rgba(32,35,58,0.18)]"
          aria-label="RUC Bible Study home"
        >
          <Image src="/rccg-logo.png" alt="" width={32} height={32} className="object-contain" />
        </Link>

        <Link
          href="/admin/login"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/70 bg-white/65 px-3 text-sm font-bold text-[#34384b] shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#6d5df6]/15"
        >
          <LockKeyhole className="h-4 w-4" />
          Admin
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-12 pt-6 sm:px-6 lg:pt-10">
        <div className="mb-7 max-w-2xl text-center">
          <p className="text-xs font-black uppercase text-[#807c92]">Redeemer's University Chapel of Power</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-[#20233a] sm:text-5xl">
            Bible Study Department member form
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-[#74798a] sm:text-base">
            Kindly fill in your details once. Your matric number and phone number are used to
            prevent duplicate entries.
          </p>
        </div>

        <FloatingWindow ariaLabel="registration form" size="form" toolbarLabel="RUC Chapel">
          <div className="mb-6 flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-[#f7f8fb] ring-1 ring-[#e8eaf0]">
              <Image src="/rccg-logo.png" alt="RCCG logo" fill sizes="48px" className="object-contain p-1.5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-[#8b90a3]">Secure registration</p>
              <h2 className="text-xl font-black text-[#20233a]">Member details</h2>
            </div>
          </div>

          <MemberForm />
        </FloatingWindow>
      </section>
    </main>
  );
}
