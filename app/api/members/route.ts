import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { toMemberInsert } from "@/lib/members";
import { flattenFieldErrors, memberFormSchema } from "@/lib/validation";

const DUPLICATE_RECORD_MESSAGE = "This member record has already been submitted.";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const submissionsByIp = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = submissionsByIp.get(ip);

  if (!current || current.resetAt < now) {
    submissionsByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, message: "Please wait a moment before submitting again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid form request." }, { status: 400 });
  }

  const parsed = memberFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Please check the highlighted fields.",
        fieldErrors: flattenFieldErrors(parsed.error)
      },
      { status: 422 }
    );
  }

  const payload = toMemberInsert(parsed.data);
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("members").insert(payload);

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: false, message: DUPLICATE_RECORD_MESSAGE }, { status: 409 });
    }

    console.error("Member submission failed", {
      code: error.code,
      message: error.message,
      details: error.details
    });

    return NextResponse.json(
      { ok: false, message: "We could not save this record right now. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Thank you. Your Bible Study Department record has been submitted."
  });
}
