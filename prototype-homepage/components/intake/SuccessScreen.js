"use client";

import { motion } from "framer-motion";

export function SuccessScreen({ onRestart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl rounded-[2rem] border border-emerald-400/20 bg-slate-950/60 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.4)] backdrop-blur"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 14 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 text-3xl text-emerald-200"
      >
        ✓
      </motion.div>
      <div className="mt-6 space-y-3">
        <p className="text-sm uppercase tracking-[0.22em] text-emerald-200/80">Project brief captured</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Your idea is in motion</h1>
        <p className="mx-auto max-w-2xl text-base leading-7 text-slate-300">
          We would typically use this brief to prepare a sharper roadmap, recommended stack, and rollout plan.
          The submission has been saved locally in this demo flow so it is easy to expand into Firebase later.
        </p>
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
      >
        Start Another Intake
      </button>
    </motion.div>
  );
}
