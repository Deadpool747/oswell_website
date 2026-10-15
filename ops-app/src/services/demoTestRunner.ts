import type { TableRow } from "@/types/dashboard";

export const testStages = ["Preparing dataset", "Executing tests", "Evaluating", "Comparing baseline", "Completed"];

function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function generateTestResult(suite: TableRow): TableRow {
  const tests = 100;
  const failed = randomInt(1, 8);
  const warnings = randomInt(1, 4);
  const passed = tests - failed - warnings;
  const passRate = Math.round((passed / tests) * 100);
  return {
    id: `TEST-${String(Date.now()).slice(-6)}`,
    name: `${suite.name ?? "Regression Suite"} Result`,
    description: `Generated frontend-only regression result for ${suite.name ?? "test suite"}.`,
    type: "Test Run",
    environment: String(suite.environment ?? "Production"),
    status: failed > 5 ? "Failed" : warnings > 2 ? "Warning" : "Passed",
    tests: String(tests),
    passed: String(passed),
    failed: String(failed),
    warnings: String(warnings),
    progress: passRate,
    duration: `${randomInt(2, 5)}m ${randomInt(10, 55)}s`,
    latency: `${(1.1 + Math.random() * 1.4).toFixed(2)}s`,
    cost: `$${(0.8 + Math.random()).toFixed(2)}`,
    time: "Just now",
    risk: failed > 5 ? "High" : warnings > 2 ? "Medium" : "Low"
  };
}
