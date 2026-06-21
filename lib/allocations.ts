import { z } from "zod";

import type { MemberRecord } from "@/lib/members";

export type WorshipCentre = {
  id: string;
  name: string;
  name_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MemberAllocation = {
  id: string;
  member_id: string;
  centre_id: string;
  assigned_by: string | null;
  assigned_at: string;
  updated_at: string;
};

export type AllocationView = MemberAllocation & {
  centre: Pick<WorshipCentre, "id" | "name" | "is_active">;
};

export type AllocationMember = MemberRecord & {
  allocation: AllocationView | null;
};

export type CentreWithCount = WorshipCentre & {
  allocation_count: number;
};

export type AdminActionResult = {
  ok: boolean;
  message: string;
};

export const centreNameSchema = z
  .string()
  .trim()
  .min(2, "Enter a centre name.")
  .max(100, "Centre names cannot exceed 100 characters.");

export const memberIdsSchema = z
  .array(z.string().uuid("Invalid member selection."))
  .min(1, "Select at least one member.")
  .max(500, "Select no more than 500 members at once.")
  .refine((ids) => new Set(ids).size === ids.length, "Member selections must be unique.");

export function attachAllocations(
  members: MemberRecord[],
  allocations: MemberAllocation[],
  centres: WorshipCentre[]
): AllocationMember[] {
  const centresById = new Map(centres.map((centre) => [centre.id, centre]));
  const allocationsByMember = new Map(
    allocations.map((allocation) => [allocation.member_id, allocation])
  );

  return members.map((member) => {
    const allocation = allocationsByMember.get(member.id);
    const centre = allocation ? centresById.get(allocation.centre_id) : undefined;

    return {
      ...member,
      allocation:
        allocation && centre
          ? {
              ...allocation,
              centre: {
                id: centre.id,
                name: centre.name,
                is_active: centre.is_active
              }
            }
          : null
    };
  });
}

export function countCentreAllocations(
  centres: WorshipCentre[],
  allocations: MemberAllocation[]
): CentreWithCount[] {
  const counts = new Map<string, number>();

  allocations.forEach((allocation) => {
    counts.set(allocation.centre_id, (counts.get(allocation.centre_id) ?? 0) + 1);
  });

  return centres.map((centre) => ({
    ...centre,
    allocation_count: counts.get(centre.id) ?? 0
  }));
}
