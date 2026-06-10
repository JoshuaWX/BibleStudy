"use client";

import { ArrowUpRight, Maximize2, Minimize2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type FloatingWindowProps = {
  ariaLabel: string;
  children: ReactNode;
  size: "form" | "login";
  toolbarLabel?: string;
};

const sizeClasses = {
  form: {
    normal: "max-w-[720px]",
    expanded: "max-w-5xl"
  },
  login: {
    normal: "max-w-[520px]",
    expanded: "max-w-2xl"
  }
};

export function FloatingWindow({ ariaLabel, children, size, toolbarLabel }: FloatingWindowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  const card = (
    <div
      className={`w-full ${isExpanded ? sizeClasses[size].expanded : sizeClasses[size].normal} rounded-[2rem] border border-white/80 bg-white/82 p-4 shadow-[0_24px_80px_rgba(42,45,67,0.16)] backdrop-blur-xl transition-all duration-300 sm:p-6`}
    >
      <div className="mb-5 flex items-center justify-between border-b border-[#e8eaf0] pb-5">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-full bg-[#ff6661]" />
          <span className="h-3.5 w-3.5 rounded-full bg-[#ffc247]" />
          <span className="h-3.5 w-3.5 rounded-full bg-[#58cf61]" />
        </div>
        <div className="flex items-center gap-3">
          {toolbarLabel ? (
            <div className="hidden items-center gap-2 rounded-2xl bg-[#f5f6fb] px-3 py-2 text-xs font-black uppercase text-[#777b8e] sm:flex">
              {toolbarLabel}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e8eaf0] bg-white text-[#34384b] shadow-[0_8px_22px_rgba(33,37,55,0.12)] transition hover:scale-[1.03] hover:border-[#d8d9e6] focus:outline-none focus:ring-4 focus:ring-[#725cff]/15"
            aria-label={isExpanded ? `Minimize ${ariaLabel}` : `Expand ${ariaLabel}`}
            aria-pressed={isExpanded}
          >
            {isExpanded ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {children}
    </div>
  );

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f7f8fb]/78 px-3 py-4 backdrop-blur-md sm:px-6 sm:py-8">
        <div className="flex min-h-full items-center justify-center">{card}</div>
      </div>
    );
  }

  return card;
}
