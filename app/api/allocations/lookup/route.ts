import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { normalizeMatricNumber } from "@/lib/normalize";
import { createMemoryRateLimiter } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const lookupSchema = z.object({
  matricNumber: z
    .string({
      required_error: "Enter a valid matric number.",
      invalid_type_error: "Enter a valid matric number."
    })
    .trim()
    .min(3, "Enter a valid matric number.")
    .max(40, "Enter a valid matric number.")
    .regex(/^[a-zA-Z0-9/_\-. ]+$/, "Enter a valid matric number.")
});

const UNAVAILABLE_MESSAGE =
  "No allocation is available for this matric number yet. Please check the number or try again later.";
const isRateLimited = createMemoryRateLimiter(60_000, 10);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return json(
      { ok: false, allocated: false, message: "Please wait a moment before searching again." },
      429
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, allocated: false, message: "Invalid lookup request." }, 400);
  }

  const parsed = lookupSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        allocated: false,
        message: parsed.error.issues[0]?.message ?? "Enter a valid matric number."
      },
      422
    );
  }

  const matricNumberKey = normalizeMatricNumber(parsed.data.matricNumber);
  const supabase = createSupabaseAdminClient();
  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id")
    .eq("matric_number_key", matricNumberKey)
    .maybeSingle();

  if (memberError) {
    console.error("Allocation member lookup failed", {
      code: memberError.code,
      message: memberError.message
    });
    return json(
      { ok: false, allocated: false, message: "We could not check allocations right now." },
      500
    );
  }

  if (!member) {
    return json({ ok: true, allocated: false, message: UNAVAILABLE_MESSAGE });
  }

  const { data: allocation, error: allocationError } = await supabase
    .from("member_allocations")
    .select("centre_id")
    .eq("member_id", member.id)
    .maybeSingle();

  if (allocationError) {
    console.error("Allocation lookup failed", {
      code: allocationError.code,
      message: allocationError.message
    });
    return json(
      { ok: false, allocated: false, message: "We could not check allocations right now." },
      500
    );
  }

  if (!allocation) {
    return json({ ok: true, allocated: false, message: UNAVAILABLE_MESSAGE });
  }

  const { data: centre, error: centreError } = await supabase
    .from("worship_centres")
    .select("name")
    .eq("id", allocation.centre_id)
    .maybeSingle();

  if (centreError || !centre) {
    if (centreError) {
      console.error("Allocation centre lookup failed", {
        code: centreError.code,
        message: centreError.message
      });
    }
    return json(
      { ok: false, allocated: false, message: "We could not check allocations right now." },
      500
    );
  }

  return json({
    ok: true,
    allocated: true,
    centre: centre.name,
    message: "Your worship centre allocation is available."
  });
}

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache"
    }
  });
}
