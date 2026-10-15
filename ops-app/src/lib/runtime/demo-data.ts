/** Demo data is opt-in for deployable static builds. */
export function demoDataEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA !== "false";
}
