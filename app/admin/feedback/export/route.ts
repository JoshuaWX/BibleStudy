import { NextResponse, type NextRequest } from "next/server";

import { isApprovedAdmin } from "@/lib/admin";
import { type AnonymousFeedbackRecord } from "@/lib/feedback";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authClient = await createSupabaseServerClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();

  if (!user || !isApprovedAdmin(user.email)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const feedbackItems = await getFeedback(request.nextUrl.searchParams.get("feedbackQ") ?? "");
  const csv = toCsv(feedbackItems);
  const fileDate = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ruc-bible-study-feedback-${fileDate}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}

async function getFeedback(searchTerm: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("anonymous_feedback")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("Admin feedback export failed", error);
    return [];
  }

  const feedbackItems = (data ?? []) as AnonymousFeedbackRecord[];
  const term = searchTerm.trim().toLowerCase();

  if (!term) {
    return feedbackItems;
  }

  return feedbackItems.filter((item) =>
    [item.observation_review, item.suggestion].join(" ").toLowerCase().includes(term)
  );
}

function toCsv(feedbackItems: AnonymousFeedbackRecord[]) {
  const headers = ["Observation / Review", "Suggestion", "Submitted At"];
  const rows = feedbackItems.map((item) => [
    item.observation_review,
    item.suggestion,
    item.submitted_at
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

function escapeCsv(value: string) {
  const safeValue = value.replace(/"/g, '""');
  return /[",\r\n]/.test(safeValue) ? `"${safeValue}"` : safeValue;
}
