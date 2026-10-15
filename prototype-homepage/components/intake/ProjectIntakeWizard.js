"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  clampBudget,
  currency,
  DEFAULT_STATE,
  estimateProjectCost,
  formatDeadline,
  TOTAL_STEPS,
  validateStep,
} from "@/lib/intake";
import { ProgressBar } from "@/components/intake/ProgressBar";
import { StepLayout } from "@/components/intake/StepLayout";
import { WizardChrome } from "@/components/intake/WizardChrome";
import { WelcomeStep } from "@/components/intake/steps/WelcomeStep";
import { ProjectTypeStep } from "@/components/intake/steps/ProjectTypeStep";
import { TargetUsersStep } from "@/components/intake/steps/TargetUsersStep";
import { FeaturesStep } from "@/components/intake/steps/FeaturesStep";
import { DesignStep } from "@/components/intake/steps/DesignStep";
import { BudgetTimelineStep } from "@/components/intake/steps/BudgetTimelineStep";
import { ContactStep } from "@/components/intake/steps/ContactStep";
import { ReviewStep } from "@/components/intake/steps/ReviewStep";
import { SuccessScreen } from "@/components/intake/SuccessScreen";

const STORAGE_KEY = "oswell-project-intake";
const SUBMISSION_KEY = "oswell-project-intake-submissions";

const STEP_CONTENT = {
  1: {
    eyebrow: "Project Intake",
    title: "Let's Build Your Project",
    description:
      "A premium onboarding flow for product discovery. Share what you want to launch and we will shape it into a clearer execution plan.",
  },
  2: {
    eyebrow: "Project Type",
    title: "What are we building together?",
    description:
      "Choose the closest product type so we can calibrate architecture, effort, and delivery shape from the start.",
  },
  3: {
    eyebrow: "Audience",
    title: "Who is this product for?",
    description:
      "Describe the people using it, the context they work in, and which device experience matters most.",
  },
  4: {
    eyebrow: "Features",
    title: "Pick the core capabilities",
    description:
      "Select the foundations you know you need. We use these to estimate complexity and the right build sequence.",
  },
  5: {
    eyebrow: "Design Direction",
    title: "Which visual tone fits your brand?",
    description:
      "This helps us align product decisions with the feeling you want users to have the first time they open it.",
  },
  6: {
    eyebrow: "Budget And Timeline",
    title: "Set the business constraints",
    description:
      "Give us the budget zone and preferred deadline so we can shape a realistic scope and rollout plan.",
  },
  7: {
    eyebrow: "Contact",
    title: "Where should we send the next steps?",
    description:
      "Add your contact details so this brief can become an actual conversation and proposal.",
  },
  8: {
    eyebrow: "Review",
    title: "Review your project brief",
    description:
      "Make sure everything looks right before submitting. You can still go back and fine-tune any step.",
  },
};

function readStorage() {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_STATE, ...JSON.parse(stored) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function ProjectIntakeWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(DEFAULT_STATE);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setFormData(readStorage());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData, isHydrated]);

  const estimate = useMemo(() => estimateProjectCost(formData), [formData]);

  const summaryItems = useMemo(
    () => [
      { label: "Project Type", value: formData.projectType || "Not selected" },
      {
        label: "Target Users",
        value: [formData.targetUsers, formData.selectedUsers.join(", ")].filter(Boolean).join(" | ") || "Not provided",
      },
      { label: "Devices", value: formData.device },
      { label: "Features", value: formData.features.join(", ") || "No features selected" },
      { label: "Design Preference", value: formData.designPreference || "Not selected" },
      { label: "Budget", value: currency(formData.budget) },
      { label: "Deadline", value: formatDeadline(formData.deadline) },
      { label: "Estimate", value: currency(estimate) },
      {
        label: "Contact",
        value: [formData.name, formData.email, formData.phone].filter(Boolean).join(" | ") || "Missing contact details",
      },
    ],
    [estimate, formData]
  );

  function updateField(key, value) {
    setFormData((current) => ({ ...current, [key]: value }));
  }

  function toggleArrayValue(key, value) {
    setFormData((current) => {
      const collection = current[key];
      const nextCollection = collection.includes(value)
        ? collection.filter((item) => item !== value)
        : [...collection, value];

      return { ...current, [key]: nextCollection };
    });
  }

  function goNext() {
    const validation = validateStep(step, formData);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setErrors({});
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  }

  function goBack() {
    setErrors({});
    setStep((current) => Math.max(1, current - 1));
  }

  function handleSubmit() {
    const validation = validateStep(7, formData);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      setStep(7);
      return;
    }

    if (typeof window !== "undefined") {
      const previous = JSON.parse(window.localStorage.getItem(SUBMISSION_KEY) || "[]");
      window.localStorage.setItem(
        SUBMISSION_KEY,
        JSON.stringify([
          {
            ...formData,
            estimate,
            submittedAt: new Date().toISOString(),
          },
          ...previous,
        ])
      );
      window.localStorage.removeItem(STORAGE_KEY);
    }

    setSubmitted(true);
  }

  function resetAll() {
    setFormData(DEFAULT_STATE);
    setErrors({});
    setStep(1);
    setSubmitted(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return <WelcomeStep />;
      case 2:
        return (
          <ProjectTypeStep
            value={formData.projectType}
            onChange={(value) => updateField("projectType", value)}
            error={errors.projectType}
          />
        );
      case 3:
        return (
          <TargetUsersStep
            formData={formData}
            onTextChange={(value) => updateField("targetUsers", value)}
            onToggleUser={(value) => toggleArrayValue("selectedUsers", value)}
            onDeviceChange={(value) => updateField("device", value)}
            error={errors.targetUsers}
          />
        );
      case 4:
        return (
          <FeaturesStep
            value={formData.features}
            onToggle={(value) => toggleArrayValue("features", value)}
            error={errors.features}
          />
        );
      case 5:
        return (
          <DesignStep
            value={formData.designPreference}
            onChange={(value) => updateField("designPreference", value)}
            error={errors.designPreference}
          />
        );
      case 6:
        return (
          <BudgetTimelineStep
            budget={formData.budget}
            deadline={formData.deadline}
            onBudgetChange={(value) => updateField("budget", clampBudget(value))}
            onDeadlineChange={(value) => updateField("deadline", value)}
            error={errors.deadline}
          />
        );
      case 7:
        return (
          <ContactStep
            formData={formData}
            onChange={updateField}
            errors={errors}
          />
        );
      case 8:
        return <ReviewStep summaryItems={summaryItems} />;
      default:
        return null;
    }
  }

  const content = STEP_CONTENT[step];

  if (!isHydrated) {
    return (
      <div className="space-y-8">
        <ProgressBar step={1} totalSteps={TOTAL_STEPS} />
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[rgba(8,15,29,0.72)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.36)] backdrop-blur">
            <div className="space-y-4">
              <div className="h-4 w-28 rounded-full bg-white/10" />
              <div className="h-10 w-3/4 rounded-full bg-white/10" />
              <div className="h-28 rounded-[1.5rem] bg-white/5" />
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 backdrop-blur">
            <div className="space-y-4">
              <div className="h-4 w-24 rounded-full bg-white/10" />
              <div className="h-9 w-40 rounded-full bg-white/10" />
              <div className="h-24 rounded-[1.5rem] bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return <SuccessScreen onRestart={resetAll} />;
  }

  return (
    <div className="space-y-8">
      <ProgressBar step={step} totalSteps={TOTAL_STEPS} />
      <StepLayout
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        aside={
          <WizardChrome
            estimate={currency(estimate)}
            budgetLabel={currency(formData.budget)}
            projectType={formData.projectType}
            featureCount={formData.features.length}
            deadline={formatDeadline(formData.deadline)}
          />
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="rounded-[2rem] border border-white/10 bg-[rgba(8,15,29,0.72)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.36)] backdrop-blur"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          <div className="flex flex-col gap-3 sm:flex-row">
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
              >
                {step === 1 ? "Start" : "Next"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
              >
                Submit Project Brief
              </button>
            )}
          </div>
        </div>
      </StepLayout>
    </div>
  );
}
