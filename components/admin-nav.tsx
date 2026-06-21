import Link from "next/link";
import { Building2, MapPinned, MessageSquareText, UsersRound } from "lucide-react";

type AdminNavProps = {
  active: "members" | "allocations" | "centres" | "feedback";
};

const items = [
  { key: "members", href: "/admin", label: "Members", icon: UsersRound },
  { key: "allocations", href: "/admin/allocations", label: "Allocations", icon: MapPinned },
  { key: "centres", href: "/admin/centres", label: "Centres", icon: Building2 },
  { key: "feedback", href: "/admin#feedback", label: "Feedback", icon: MessageSquareText }
] as const;

export function AdminNav({ active }: AdminNavProps) {
  return (
    <nav
      aria-label="Admin sections"
      className="mb-5 overflow-x-auto rounded-lg border border-white/80 bg-white/82 p-1.5 shadow-[0_12px_36px_rgba(42,45,67,0.08)] backdrop-blur-xl"
    >
      <div className="flex min-w-max gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`inline-flex h-11 items-center gap-2 rounded-md px-3.5 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-[#725cff]/15 ${
                isActive
                  ? "bg-[#20233a] text-white shadow-sm"
                  : "text-[#676d80] hover:bg-[#f5f6fb] hover:text-[#20233a]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
