"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireApprovedAdmin } from "@/lib/admin";
import { type AdminActionResult, centreNameSchema } from "@/lib/allocations";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const centreIdSchema = z.string().uuid("Invalid worship centre.");

export async function createCentre(name: unknown): Promise<AdminActionResult> {
  await requireApprovedAdmin();
  const parsed = centreNameSchema.safeParse(name);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid centre name." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("worship_centres").insert({ name: parsed.data });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "A worship centre with this name already exists." };
    }

    console.error("Worship centre creation failed", { code: error.code, message: error.message });
    return { ok: false, message: "The worship centre could not be added." };
  }

  revalidateCentrePages();
  return { ok: true, message: "Worship centre added." };
}

export async function renameCentre(id: unknown, name: unknown): Promise<AdminActionResult> {
  await requireApprovedAdmin();
  const idResult = centreIdSchema.safeParse(id);
  const nameResult = centreNameSchema.safeParse(name);

  if (!idResult.success || !nameResult.success) {
    return {
      ok: false,
      message:
        idResult.error?.issues[0]?.message ??
        nameResult.error?.issues[0]?.message ??
        "Invalid centre update."
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("worship_centres")
    .update({ name: nameResult.data })
    .eq("id", idResult.data)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "A worship centre with this name already exists." };
    }

    console.error("Worship centre rename failed", { code: error.code, message: error.message });
    return { ok: false, message: "The worship centre could not be renamed." };
  }

  if (!data) {
    return { ok: false, message: "This worship centre no longer exists." };
  }

  revalidateCentrePages();
  return { ok: true, message: "Worship centre renamed." };
}

export async function setCentreActive(id: unknown, isActive: unknown): Promise<AdminActionResult> {
  await requireApprovedAdmin();
  const parsed = z
    .object({ id: centreIdSchema, isActive: z.boolean() })
    .safeParse({ id, isActive });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid centre update." };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("worship_centres")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("Worship centre status update failed", {
      code: error?.code,
      message: error?.message
    });
    return { ok: false, message: "The worship centre status could not be updated." };
  }

  revalidateCentrePages();
  return {
    ok: true,
    message: parsed.data.isActive ? "Worship centre restored." : "Worship centre archived."
  };
}

function revalidateCentrePages() {
  revalidatePath("/admin");
  revalidatePath("/admin/allocations");
  revalidatePath("/admin/centres");
  revalidatePath("/admin/export");
}
