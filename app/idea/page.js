import { ProjectIntakeWizard } from "@/components/intake/ProjectIntakeWizard";

export const metadata = {
  title: "Project Intake | Oswell Ops",
  description: "Premium multi-step intake flow for collecting project requirements.",
};

export default function IdeaPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Oswell Technologies</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Premium Project Intake</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="../contact.html"
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:border-white/20"
            >
              Contact
            </a>
            <a
              href="../index.html"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
            >
              Main Website
            </a>
          </div>
        </header>

        <ProjectIntakeWizard />
      </div>
    </main>
  );
}
