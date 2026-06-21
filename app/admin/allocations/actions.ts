"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireApprovedAdmin } from "@/lib/admin";
import { type AdminActionResult, memberIdsSchema } from "@/lib/allocations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const assignSchema = z.object({
  memberIds: memberIdsSchema,
  centreId: z.string().uuid("Choose a valid worship centre.")
});

const unassignSchema = z.object({
  memberIds: memberIdsSchema
});

export async function assignMembers(input: unknown): Promise<AdminActionResult> {
  const user = await requireApprovedAdmin();
  const parsed = assignSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid allocation request." };
  }

  const { memberIds, centreId } = parsed.data;
  const supabase = createSupabaseAdminClient();
  const [{ data: centre, error: centreError }, { data: members, error: membersError }] =
    await Promise.all([
      supabase.from("worship_centres").select("id, is_active").eq("id", centreId).maybeSingle(),
      supabase.from("members").select("id").in("id", memberIds)
    ]);

  if (centreError || !centre || !centre.is_active) {
    return { ok: false, message: "Choose an active worship centre." };
  }

  if (membersError || (members?.length ?? 0) !== memberIds.length) {
    return {
      ok: false,
      message: "One or more selected members are no longer available. Refresh and try again."
    };
  }

  const assignedAt = new Date().toISOString();
  const rows = memberIds.map((memberId) => ({
    member_id: memberId,
    centre_id: centreId,
    assigned_by: user.id,
    assigned_at: assignedAt,
    updated_at: assignedAt
  }));
  const { error } = await supabase
    .from("member_allocations")
    .upsert(rows, { onConflict: "member_id" });

  if (error) {
    console.error("Member allocation failed", { code: error.code, message: error.message });
    return { ok: false, message: "The allocation could not be saved. Please try again." };
  }

  revalidateAllocationPages();
  return {
    ok: true,
    message: `${memberIds.length} member${memberIds.length === 1 ? "" : "s"} allocated successfully.`
  };
}

export async function unassignMembers(input: unknown): Promise<AdminActionResult> {
  await requireApprovedAdmin();
  const parsed = unassignSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid allocation request." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("member_allocations")
    .delete()
    .in("member_id", parsed.data.memberIds);

  if (error) {
    console.error("Member unassignment failed", { code: error.code, message: error.message });
    return { ok: false, message: "The allocation could not be removed. Please try again." };
  }

  revalidateAllocationPages();
  return {
    ok: true,
    message: `${parsed.data.memberIds.length} member${parsed.data.memberIds.length === 1 ? "" : "s"} unassigned.`
  };
}

function revalidateAllocationPages() {
  revalidatePath("/admin");
  revalidatePath("/admin/allocations");
  revalidatePath("/admin/centres");
  revalidatePath("/admin/export");
}
