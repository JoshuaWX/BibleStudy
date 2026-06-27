import { NextResponse, type NextRequest } from "next/server";

import { isApprovedAdmin } from "@/lib/admin";
import {
  attachAllocations,
  type AllocationMember,
  type MemberAllocation,
  type WorshipCentre
} from "@/lib/allocations";
import { GENDERS, TRAINING_STATUSES, isGender, isLevel, isTrainingStatus } from "@/lib/constants";
import { type MemberRecord } from "@/lib/members";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MEMBER_SORT_OPTIONS = ["submitted", "birth_month"] as const;
type MemberSort = (typeof MEMBER_SORT_OPTIONS)[number];

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
    gender: params.get("gender") ?? "",
    level: params.get("level") ?? "",
    memberSort: params.get("memberSort") ?? ""
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

async function getExportMembers(filters: { q: string; status: string; gender: string; level: string; memberSort: string }) {
  const supabase = createSupabaseAdminClient();
  const sortMode = normalizeMemberSort(filters.memberSort);
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

  if (filters.level && isLevel(filters.level)) {
    query = query.eq("level", filters.level);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Admin export failed", error);
    return [];
  }

  const [allocationsResult, centresResult] = await Promise.all([
    supabase.from("member_allocations").select("*").limit(5000),
    supabase.from("worship_centres").select("*")
  ]);

  if (allocationsResult.error) {
    console.error("Admin export allocations fetch failed", allocationsResult.error);
  }

  if (centresResult.error) {
    console.error("Admin export centres fetch failed", centresResult.error);
  }

  const members = attachAllocations(
    (data ?? []) as MemberRecord[],
    (allocationsResult.data ?? []) as MemberAllocation[],
    (centresResult.data ?? []) as WorshipCentre[]
  );
  const term = filters.q.trim().toLowerCase();

  const filteredMembers = !term
    ? members
    : members.filter((member) =>
    [
      member.surname,
      member.other_names,
      member.department,
      member.level ?? "",
      member.bible_study_unit ?? "",
      member.phone_number,
      member.phone_number_key,
      member.matric_number,
      member.matric_number_key,
      member.training_class_status,
      member.training_class_other ?? "",
      member.allocation?.centre.name ?? ""
    ]
      .join(" ")
      .toLowerCase()
      .includes(term)
  );

  return sortMembers(filteredMembers, sortMode);
}

function normalizeMemberSort(value?: string): MemberSort {
  return MEMBER_SORT_OPTIONS.includes(value as MemberSort) ? (value as MemberSort) : "submitted";
}

function sortMembers(members: AllocationMember[], sortMode: MemberSort): AllocationMember[] {
  if (sortMode === "submitted") {
    return members;
  }

  return [...members].sort((first, second) => {
    const firstDate = new Date(`${first.birthday}T00:00:00`);
    const secondDate = new Date(`${second.birthday}T00:00:00`);

    const monthDiff = firstDate.getUTCMonth() - secondDate.getUTCMonth();
    if (monthDiff !== 0) {
      return monthDiff;
    }

    const dayDiff = firstDate.getUTCDate() - secondDate.getUTCDate();
    if (dayDiff !== 0) {
      return dayDiff;
    }

    const firstName = `${first.surname} ${first.other_names}`.trim();
    const secondName = `${second.surname} ${second.other_names}`.trim();
    return firstName.localeCompare(secondName, "en", { sensitivity: "base" });
  });
}

function toCsv(members: AllocationMember[]) {
  const headers = [
    "Surname",
    "Other Names",
    "Department",
    "Level",
    "Bible Study Unit",
    "Phone Number",
    "Birthday",
    "Gender",
    "Matric Number",
    "Training Class Status",
    "Other Status",
    "Worship Centre",
    "Allocation Status",
    "Allocated At",
    "Submitted At"
  ];

  const rows = members.map((member) => [
    member.surname,
    member.other_names,
    member.department,
    member.level ?? "",
    member.bible_study_unit ?? "",
    member.phone_number_key,
    member.birthday,
    member.gender,
    member.matric_number,
    member.training_class_status,
    member.training_class_other ?? "",
    member.allocation?.centre.name ?? "",
    member.allocation ? "Allocated" : "Unallocated",
    member.allocation?.assigned_at ?? "",
    member.submitted_at
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

function escapeCsv(value: string) {
  const safeValue = value.replace(/"/g, '""');
  return /[",\r\n]/.test(safeValue) ? `"${safeValue}"` : safeValue;
}
