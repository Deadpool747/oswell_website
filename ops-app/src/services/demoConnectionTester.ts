export const connectionStages = ["Checking endpoint", "Validating authentication", "Testing permissions", "Measuring latency", "Complete"];

export function generateConnectionResult() {
  const success = Math.random() > 0.18;
  return success
    ? {
        status: "Active",
        health: "Healthy",
        latency: `${Math.floor(90 + Math.random() * 210)} ms`,
        authentication: "Valid",
        permissions: "Available",
        message: "Connection successful"
      }
    : {
        status: "Warning",
        health: "Degraded",
        latency: "--",
        authentication: "Review Required",
        permissions: "Limited",
        message: "Authentication validation failed. Edit configuration or retry."
      };
}
