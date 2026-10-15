import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const apiDir = join(rootDir, "src", "app", "api");
const backupDir = join(rootDir, ".tmp", "static-export-api");
const entraAuthFile = join(rootDir, "src", "lib", "auth", "entra.ts");
const entraAuthBackup = join(rootDir, ".tmp", "static-export-entra.ts");
const nextDir = join(rootDir, ".next");
const productionApiUrl = process.env.NEXT_PUBLIC_PRODUCTION_API_URL?.trim() ?? "";
const authMode = process.env.NEXT_PUBLIC_AUTH_MODE?.trim() ?? "entra";
const demoDataSetting = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA?.trim() ?? (productionApiUrl ? "false" : "true");
const productionFoundryApiUrl = process.env.NEXT_PUBLIC_PRODUCTION_FOUNDRY_API_URL?.trim()
  ?? (productionApiUrl ? `${productionApiUrl.replace(/\/$/, "")}/api/providers/azure` : "");

if (productionApiUrl && !productionApiUrl.startsWith("https://")) {
  throw new Error("NEXT_PUBLIC_PRODUCTION_API_URL must use HTTPS when building a deployable static bundle.");
}
if (productionFoundryApiUrl && !productionFoundryApiUrl.startsWith("https://")) {
  throw new Error("NEXT_PUBLIC_PRODUCTION_FOUNDRY_API_URL must use HTTPS when building a deployable static bundle.");
}
if (productionApiUrl) {
  if (!["entra", "local"].includes(authMode)) {
    throw new Error("NEXT_PUBLIC_AUTH_MODE must be entra or local.");
  }
  if (authMode === "entra") {
    const requiredIdentityConfig = ["NEXT_PUBLIC_AZURE_AD_CLIENT_ID", "NEXT_PUBLIC_AZURE_AD_TENANT_ID", "NEXT_PUBLIC_AZURE_AD_API_SCOPE"];
    const missing = requiredIdentityConfig.filter((name) => !process.env[name]?.trim());
    if (missing.length) throw new Error(`Production static builds require Entra authentication configuration: ${missing.join(", ")}`);
  }
  if (demoDataSetting !== "false") {
    throw new Error("Production static builds must set NEXT_PUBLIC_ENABLE_DEMO_DATA=false until all dashboard routes use live APIs.");
  }
}

function restoreApiDir() {
  if (!existsSync(backupDir)) return;
  rmSync(apiDir, { recursive: true, force: true });
  mkdirSync(dirname(apiDir), { recursive: true });
  renameSync(backupDir, apiDir);
}

function prepareLocalAuthModule() {
  if (authMode !== "local") return;
  if (!existsSync(entraAuthFile)) throw new Error("Local-auth static build requires src/lib/auth/entra.ts.");
  rmSync(entraAuthBackup, { force: true });
  renameSync(entraAuthFile, entraAuthBackup);
  // Do not include the dormant MSAL implementation in a local-auth bundle.
  writeFileSync(entraAuthFile, `export function localAuthenticationEnabled() { return true; }\nexport function entraAuthenticationEnabled() { return false; }\nexport async function requireEntraSession() {}\nexport async function accessToken() { return null; }\n`);
}

function restoreAuthModule() {
  if (!existsSync(entraAuthBackup)) return;
  rmSync(entraAuthFile, { force: true });
  renameSync(entraAuthBackup, entraAuthFile);
}

try {
  if (existsSync(apiDir)) {
    rmSync(backupDir, { recursive: true, force: true });
    mkdirSync(dirname(backupDir), { recursive: true });
    renameSync(apiDir, backupDir);
    console.log("Temporarily disabled src/app/api for static export.");
  }
  prepareLocalAuthModule();

  rmSync(nextDir, { recursive: true, force: true });

  const command = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(command, ["next", "build", "--webpack"], {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_STATIC_EXPORT: "1",
      // Never let a local development API address leak into the deployable bundle.
      NEXT_PUBLIC_API_URL: productionApiUrl,
      NEXT_PUBLIC_FOUNDRY_API_URL: productionFoundryApiUrl,
      NEXT_PUBLIC_ENABLE_DEMO_DATA: demoDataSetting,
      NEXT_PUBLIC_AUTH_MODE: authMode,
      // A deployable build must never retain a local demo-mode toggle from .env.local.
      NEXT_PUBLIC_APP_MODE: productionApiUrl ? "production" : (process.env.NEXT_PUBLIC_APP_MODE ?? "development"),
      // A local-auth deployment does not need, or ship, the retained Entra SPA
      // identifiers. Empty process values take precedence over .env.local.
      ...(authMode === "local" ? {
        NEXT_PUBLIC_AZURE_AD_CLIENT_ID: "",
        NEXT_PUBLIC_AZURE_AD_TENANT_ID: "",
        NEXT_PUBLIC_AZURE_AD_API_SCOPE: "",
      } : {}),
    }
  });

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
} finally {
  restoreAuthModule();
  restoreApiDir();
}
