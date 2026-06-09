import { z } from "zod";

import { GENDERS, TRAINING_STATUSES } from "@/lib/constants";
import { normalizeMatricNumber, normalizePhoneNumber } from "@/lib/normalize";

const today = new Date();
today.setHours(23, 59, 59, 999);

export const memberFormSchema = z
  .object({
    surname: z.string().trim().min(2, "Enter a valid surname.").max(80),
    otherNames: z.string().trim().min(2, "Enter the member's other names.").max(120),
    department: z.string().trim().min(2, "Enter the department.").max(120),
    phoneNumber: z.string().trim().min(7, "Enter a valid phone number.").max(30),
    birthday: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid birthday.")
      .refine((value) => {
        const parsed = new Date(`${value}T00:00:00`);
        return !Number.isNaN(parsed.getTime()) && parsed <= today;
      }, "Birthday cannot be in the future."),
    gender: z.enum(GENDERS, { required_error: "Choose a gender." }),
    matricNumber: z
      .string()
      .trim()
      .min(3, "Enter a valid matric number.")
      .max(40)
      .regex(/^[a-zA-Z0-9/_\-. ]+$/, "Use only letters, numbers, /, -, _, or ."),
    trainingClassStatus: z.enum(TRAINING_STATUSES, {
      required_error: "Choose a training class status."
    }),
    trainingClassOther: z.string().trim().max(120).optional(),
    website: z.string().optional()
  })
  .superRefine((value, context) => {
    if (value.website) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unable to submit this form.",
        path: ["website"]
      });
    }

    if (value.trainingClassStatus === "Other" && !value.trainingClassOther?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please specify the training class status.",
        path: ["trainingClassOther"]
      });
    }

    const phoneKey = normalizePhoneNumber(value.phoneNumber);
    if (!phoneKey) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number.",
        path: ["phoneNumber"]
      });
    }

    const matricKey = normalizeMatricNumber(value.matricNumber);
    if (matricKey.length < 3) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid matric number.",
        path: ["matricNumber"]
      });
    }
  });

export type MemberFormInput = z.infer<typeof memberFormSchema>;

export function flattenFieldErrors(error: z.ZodError<MemberFormInput>) {
  const fieldErrors = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0] ?? "Invalid value."])
  );
}
