import { NextResponse, type NextRequest } from "next/server";

import { feedbackSchema, flattenFeedbackErrors, toFeedbackInsert } from "@/lib/feedback";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid feedback request." }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Please check the highlighted fields.",
        fieldErrors: flattenFeedbackErrors(parsed.error)
      },
      { status: 422 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("anonymous_feedback").insert(toFeedbackInsert(parsed.data));

  if (error) {
    console.error("Anonymous feedback submission failed", {
      code: error.code,
      message: error.message,
      details: error.details
    });

    return NextResponse.json(
      { ok: false, message: "We could not save this feedback right now. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Thank you. Your anonymous feedback has been submitted."
  });
}
