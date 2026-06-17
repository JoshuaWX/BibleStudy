"use client";

import { ArrowUpRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { BIBLE_STUDY_UNITS, GENDERS, LEVELS, TRAINING_STATUSES } from "@/lib/constants";

type FieldErrors = Record<string, string>;

const initialForm = {
  surname: "",
  otherNames: "",
  department: "",
  level: "",
  phoneNumber: "",
  birthday: "",
  gender: "",
  matricNumber: "",
  trainingClassStatus: "",
  trainingClassOther: "",
  bibleStudyUnit: "",
  website: ""
};

const initialFeedback = {
  observationReview: "",
  suggestion: ""
};

export function MemberForm() {
  const [step, setStep] = useState<"member" | "feedback" | "done">("member");
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedbackErrors, setFeedbackErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const isOther = form.trainingClassStatus === "Other";
  const maxBirthday = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function updateField(name: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function updateFeedbackField(name: keyof typeof initialFeedback, value: string) {
    setFeedback((current) => ({ ...current, [name]: value }));
    setFeedbackErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setStatus("idle");

    const response = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const result = (await response.json()) as {
      ok: boolean;
      message: string;
      fieldErrors?: FieldErrors;
    };

    setIsSubmitting(false);
    setMessage(result.message);

    if (!result.ok) {
      setStatus("error");
      setFieldErrors(result.fieldErrors ?? {});
      return;
    }

    setStatus("idle");
    setMessage("");
    setFieldErrors({});
    setForm(initialForm);
    setFeedback(initialFeedback);
    setFeedbackErrors({});
    setStep("feedback");
  }

  async function handleFeedbackSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingFeedback(true);
    setMessage("");
    setStatus("idle");

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback)
    });

    const result = (await response.json()) as {
      ok: boolean;
      message: string;
      fieldErrors?: FieldErrors;
    };

    setIsSubmittingFeedback(false);
    setMessage(result.message);

    if (!result.ok) {
      setStatus("error");
      setFeedbackErrors(result.fieldErrors ?? {});
      return;
    }

    setStatus("success");
    setFeedbackErrors({});
    setFeedback(initialFeedback);
    setStep("done");
  }

  function handleSkipFeedback() {
    setMessage("Thank you. Your member details have been received.");
    setStatus("success");
    setFeedbackErrors({});
    setFeedback(initialFeedback);
    setStep("done");
  }

  if (step === "feedback") {
    return (
      <form onSubmit={handleFeedbackSubmit} className="space-y-6" noValidate>
        <div className="rounded-2xl border border-[#e2defc] bg-[#f7f5ff] px-4 py-4 text-sm font-bold leading-6 text-[#5f587c]">
          This feedback is fully anonymous and cannot be linked to your member details.
        </div>

        <Field
          label="What are your observations and reviews concerning Bible Study?"
          error={feedbackErrors.observationReview}
        >
          <textarea
            className="field-input min-h-36 resize-y leading-7"
            value={feedback.observationReview}
            onChange={(event) => updateFeedbackField("observationReview", event.target.value)}
            placeholder="Share your honest observation or review"
            required
          />
        </Field>

        <Field
          label="What suggestion do you have that you would like us to implement moving forward?"
          error={feedbackErrors.suggestion}
        >
          <textarea
            className="field-input min-h-36 resize-y leading-7"
            value={feedback.suggestion}
            onChange={(event) => updateFeedbackField("suggestion", event.target.value)}
            placeholder="Suggest something that can be done better"
            required
          />
        </Field>

        {message ? (
          <StatusMessage status={status} message={message} />
        ) : null}

        <div className="grid gap-3 border-t border-[#e8eaf0] pt-5 sm:grid-cols-[1fr_auto]">
          <button
            type="submit"
            disabled={isSubmittingFeedback}
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-[#6d5df6] px-6 text-base font-black text-white shadow-[0_12px_28px_rgba(109,93,246,0.24)] transition hover:bg-[#5c4bee] focus:outline-none focus:ring-4 focus:ring-[#725cff]/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmittingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit feedback
            {!isSubmittingFeedback ? <ArrowUpRight className="ml-2 h-4 w-4" /> : null}
          </button>
          <button
            type="button"
            onClick={handleSkipFeedback}
            className="inline-flex h-14 items-center justify-center rounded-2xl border border-[#e0e3ea] bg-white px-6 text-base font-black text-[#5f6678] shadow-[0_5px_16px_rgba(25,29,45,0.06)] transition hover:border-[#cfd3df] hover:text-[#20233a] focus:outline-none focus:ring-4 focus:ring-[#725cff]/10"
          >
            Skip / Done
          </button>
        </div>
      </form>
    );
  }

  if (step === "done") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-emerald-900">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="text-lg font-black">Thank you</h3>
              <p className="mt-1 text-sm font-bold leading-6">
                Your response has been received. We appreciate your time and contribution to the
                Bible Study Department.
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setStatus("idle");
            setStep("member");
          }}
          className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-[#e0e3ea] bg-white px-6 text-base font-black text-[#5f6678] shadow-[0_5px_16px_rgba(25,29,45,0.06)] transition hover:border-[#cfd3df] hover:text-[#20233a] focus:outline-none focus:ring-4 focus:ring-[#725cff]/10"
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Surname" error={fieldErrors.surname}>
          <input
            className="field-input"
            autoComplete="family-name"
            value={form.surname}
            onChange={(event) => updateField("surname", event.target.value)}
            placeholder="e.g. Adeola"
            required
          />
        </Field>

        <Field label="Other Names" error={fieldErrors.otherNames}>
          <input
            className="field-input"
            autoComplete="given-name"
            value={form.otherNames}
            onChange={(event) => updateField("otherNames", event.target.value)}
            placeholder="e.g. Daniel Oluwaseun"
            required
          />
        </Field>

        <Field label="Department" error={fieldErrors.department}>
          <input
            className="field-input"
            value={form.department}
            onChange={(event) => updateField("department", event.target.value)}
            placeholder="e.g. Computer Science"
            required
          />
        </Field>

        <Field label="Level" error={fieldErrors.level}>
          <select
            className="field-input"
            value={form.level}
            onChange={(event) => updateField("level", event.target.value)}
            required
          >
            <option value="">Select level</option>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Phone Number" error={fieldErrors.phoneNumber}>
          <input
            className="field-input"
            autoComplete="tel"
            inputMode="tel"
            value={form.phoneNumber}
            onChange={(event) => updateField("phoneNumber", event.target.value)}
            placeholder="e.g. 08012345678"
            required
          />
        </Field>

        <Field label="Birthday" error={fieldErrors.birthday}>
          <input
            className="field-input"
            type="date"
            max={maxBirthday}
            value={form.birthday}
            onChange={(event) => updateField("birthday", event.target.value)}
            required
          />
        </Field>

        <Field label="Gender" error={fieldErrors.gender}>
          <select
            className="field-input"
            value={form.gender}
            onChange={(event) => updateField("gender", event.target.value)}
            required
          >
            <option value="">Select gender</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Matric Number" error={fieldErrors.matricNumber}>
          <input
            className="field-input uppercase"
            autoCapitalize="characters"
            value={form.matricNumber}
            onChange={(event) => updateField("matricNumber", event.target.value)}
            placeholder="e.g. RUN/CMP/23/12345"
            required
          />
        </Field>

        <Field label="Training Class Status" error={fieldErrors.trainingClassStatus}>
          <select
            className="field-input"
            value={form.trainingClassStatus}
            onChange={(event) => updateField("trainingClassStatus", event.target.value)}
            required
          >
            <option value="">Select status</option>
            {TRAINING_STATUSES.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption}
              </option>
            ))}
          </select>
        </Field>

        {isOther ? (
          <div className="sm:col-span-2">
            <Field label="Specify Other Status" error={fieldErrors.trainingClassOther}>
              <input
                className="field-input"
                value={form.trainingClassOther}
                onChange={(event) => updateField("trainingClassOther", event.target.value)}
                placeholder="Please specify the class or role"
                required
              />
            </Field>
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <Field
            label="What unit would you like to join in Bible Study?"
            error={fieldErrors.bibleStudyUnit}
          >
            <select
              className="field-input"
              value={form.bibleStudyUnit}
              onChange={(event) => updateField("bibleStudyUnit", event.target.value)}
              required
            >
              <option value="">Select unit</option>
              {BIBLE_STUDY_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <input
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={(event) => updateField("website", event.target.value)}
        aria-hidden="true"
      />

      {message ? <StatusMessage status={status} message={message} /> : null}

      <div className="border-t border-[#e8eaf0] pt-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-[#777d8f]">
          <ShieldCheck className="h-4 w-4 text-[#6d5df6]" />
          Protected server submission
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[#6d5df6] px-6 text-base font-black text-white shadow-[0_12px_28px_rgba(109,93,246,0.24)] transition hover:bg-[#5c4bee] focus:outline-none focus:ring-4 focus:ring-[#725cff]/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Submit details
          {!isSubmitting ? <ArrowUpRight className="ml-2 h-4 w-4" /> : null}
        </button>
      </div>
    </form>
  );
}

function StatusMessage({ status, message }: { status: "idle" | "error" | "success"; message: string }) {
  return (
    <div
      role="status"
      className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
        status === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="flex gap-2">
        {status === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : null}
        <span>{message}</span>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error ? <p className="field-error">{error}</p> : null}
    </label>
  );
}
