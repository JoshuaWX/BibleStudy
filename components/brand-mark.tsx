import Image from "next/image";

type BrandMarkProps = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 overflow-hidden rounded-md border border-white/40 bg-white shadow-sm">
        <Image src="/rccg-logo.png" alt="RCCG logo" fill sizes="48px" className="object-contain p-1" />
      </div>
      {!compact ? (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-chapel-gold">RUC Chapel of Power</p>
          <p className="text-base font-black text-white sm:text-lg">Bible Study Department</p>
        </div>
      ) : null}
    </div>
  );
}
