import { NextResponse, type NextRequest } from "next/server";

import { isApprovedAdmin } from "@/lib/admin";
import { GENDERS, TRAINING_STATUSES, isGender, isTrainingStatus } from "@/lib/constants";
import { type MemberRecord } from "@/lib/members";
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

  const params = request.nextUrl.searchParams;
  const members = await getExportMembers({
    q: params.get("q") ?? "",
    status: params.get("status") ?? "",
    gender: params.get("gender") ?? ""
  });

  const csv = toCsv(members);
  const fileDate = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ruc-bible-study-members-${fileDate}.csv"`,
      "Cache-Control": "no-store"
    }
  });
}

async function getExportMembers(filters: { q: string; status: string; gender: string }) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("members")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(5000);

  if (filters.status && isTrainingStatus(filters.status)) {
    query = query.eq("training_class_status", filters.status);
  }

  if (filters.gender && isGender(filters.gender)) {
    query = query.eq("gender", filters.gender);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Admin export failed", error);
    return [];
  }

  const members = (data ?? []) as MemberRecord[];
  const term = filters.q.trim().toLowerCase();

  if (!term) {
    return members;
  }

  return members.filter((member) =>
    [
      member.surname,
      member.other_names,
      member.department,
      member.phone_number,
      member.phone_number_key,
      member.matric_number,
      member.matric_number_key,
      member.training_class_status,
      member.training_class_other ?? ""
    ]
      .join(" ")
      .toLowerCase()
      .includes(term)
  );
}

function toCsv(members: MemberRecord[]) {
  const headers = [
    "Surname",
    "Other Names",
    "Department",
    "Phone Number",
    "Birthday",
    "Gender",
    "Matric Number",
    "Training Class Status",
    "Other Status",
    "Submitted At"
  ];

  const rows = members.map((member) => [
    member.surname,
    member.other_names,
    member.department,
    member.phone_number_key,
    member.birthday,
    member.gender,
    member.matric_number,
    member.training_class_status,
    member.training_class_other ?? "",
    member.submitted_at
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

function escapeCsv(value: string) {
  const safeValue = value.replace(/"/g, '""');
  return /[",\r\n]/.test(safeValue) ? `"${safeValue}"` : safeValue;
}
