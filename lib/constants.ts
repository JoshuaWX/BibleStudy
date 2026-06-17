export const TRAINING_STATUSES = [
  "Teacher",
  "Assistant teacher",
  "In Workers in training class",
  "On workers IT",
  "In baptismal class",
  "In Believers class",
  "Other"
] as const;

export const GENDERS = ["Male", "Female"] as const;

export const LEVELS = ["100 level", "200 level", "300 level", "400 level", "500 level"] as const;

export const BIBLE_STUDY_UNITS = [
  "Prayer unit",
  "Compliance unit",
  "Welfare unit",
  "Outline-Collation unit"
] as const;

export type TrainingStatus = (typeof TRAINING_STATUSES)[number];
export type Gender = (typeof GENDERS)[number];
export type Level = (typeof LEVELS)[number];
export type BibleStudyUnit = (typeof BIBLE_STUDY_UNITS)[number];

export function isTrainingStatus(value: string): value is TrainingStatus {
  return TRAINING_STATUSES.includes(value as TrainingStatus);
}

export function isGender(value: string): value is Gender {
  return GENDERS.includes(value as Gender);
}

export function isLevel(value: string): value is Level {
  return LEVELS.includes(value as Level);
}

export function isBibleStudyUnit(value: string): value is BibleStudyUnit {
  return BIBLE_STUDY_UNITS.includes(value as BibleStudyUnit);
}
