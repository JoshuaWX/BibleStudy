import { normalizeMatricNumber, normalizePhoneNumber } from "@/lib/normalize";
import type { MemberFormInput } from "@/lib/validation";

export type MemberRecord = {
  id: string;
  surname: string;
  other_names: string;
  department: string;
  level: string | null;
  phone_number: string;
  phone_number_key: string;
  birthday: string;
  gender: string;
  matric_number: string;
  matric_number_key: string;
  training_class_status: string;
  training_class_other: string | null;
  submitted_at: string;
};

export function toMemberInsert(input: MemberFormInput) {
  const matricKey = normalizeMatricNumber(input.matricNumber);
  const phoneKey = normalizePhoneNumber(input.phoneNumber);

  return {
    surname: input.surname.trim(),
    other_names: input.otherNames.trim(),
    department: input.department.trim(),
    level: input.level,
    phone_number: input.phoneNumber.trim(),
    phone_number_key: phoneKey,
    birthday: input.birthday,
    gender: input.gender,
    matric_number: input.matricNumber.trim(),
    matric_number_key: matricKey,
    training_class_status: input.trainingClassStatus,
    training_class_other:
      input.trainingClassStatus === "Other" ? input.trainingClassOther?.trim() || null : null
  };
}

export function memberDisplayName(member: Pick<MemberRecord, "surname" | "other_names">) {
  return `${member.surname} ${member.other_names}`.replace(/\s+/g, " ").trim();
}
