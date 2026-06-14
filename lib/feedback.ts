import { z } from "zod";

export const feedbackSchema = z.object({
  observationReview: z
    .string()
    .trim()
    .min(3, "Please share your observation or review.")
    .max(2000, "Please keep this response under 2,000 characters."),
  suggestion: z
    .string()
    .trim()
    .min(3, "Please share a suggestion.")
    .max(2000, "Please keep this response under 2,000 characters.")
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export type AnonymousFeedbackRecord = {
  id: string;
  observation_review: string;
  suggestion: string;
  submitted_at: string;
};

export function toFeedbackInsert(input: FeedbackInput) {
  return {
    observation_review: input.observationReview.trim(),
    suggestion: input.suggestion.trim()
  };
}

export function flattenFeedbackErrors(error: z.ZodError<FeedbackInput>) {
  const fieldErrors = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0] ?? "Invalid value."])
  );
}
