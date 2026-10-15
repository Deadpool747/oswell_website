import { PublicClientApplication } from "@azure/msal-browser";

const clientId = process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID?.trim();
const tenantId = process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID?.trim();
const apiScope = process.env.NEXT_PUBLIC_AZURE_AD_API_SCOPE?.trim();
const authMode = process.env.NEXT_PUBLIC_AUTH_MODE?.trim() ?? "entra";

export function localAuthenticationEnabled() {
  return authMode === "local";
}

let client: PublicClientApplication | null = null;
let initialized = false;

export function entraAuthenticationEnabled() {
  return authMode === "entra" && Boolean(clientId && tenantId && apiScope);
}

function application() {
  if (!clientId || !tenantId || !apiScope) {
    throw new Error("Production Entra authentication is not configured.");
  }
  client ??= new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: typeof window === "undefined" ? undefined : window.location.origin,
    },
    cache: { cacheLocation: "sessionStorage" },
  });
  return client;
}

async function initialize() {
  const instance = application();
  if (!initialized) {
    await instance.initialize();
    const redirectResult = await instance.handleRedirectPromise();
    if (redirectResult?.account) {
      // A redirect callback must become the active session before guarded routes run.
      instance.setActiveAccount(redirectResult.account);
    }
    initialized = true;
  }
  return instance;
}

export async function requireEntraSession() {
  if (!entraAuthenticationEnabled()) return;
  const instance = await initialize();
  const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
  if (account) {
    instance.setActiveAccount(account);
    return;
  }
  await instance.loginRedirect({ scopes: [apiScope!] });
}

export async function accessToken(): Promise<string | null> {
  if (!entraAuthenticationEnabled()) return null;
  const instance = await initialize();
  const account = instance.getActiveAccount() ?? instance.getAllAccounts()[0];
  if (!account) {
    throw new Error("Sign in is required before accessing Oswell security data.");
  }
  const result = await instance.acquireTokenSilent({ account, scopes: [apiScope!] });
  return result.accessToken;
}
