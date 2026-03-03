const parseOrganizationId = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const DEFAULT_BACKEND_BASE_URL = "https://portal.reebspartythemes.com";

const getBackendBaseUrl = () => {
  // In local dev, always keep Netlify function calls on the local origin so
  // form tests and mutations stay isolated from production data.
  if (import.meta.env?.DEV && typeof window !== "undefined") {
    return window.location.origin;
  }

  const envBase = import.meta.env?.VITE_BACKEND_BASE_URL;
  const trimmed = typeof envBase === "string" ? envBase.trim() : "";
  if (trimmed) return trimmed.replace(/\/+$/, "");
  return DEFAULT_BACKEND_BASE_URL;
};

const BACKEND_BASE_URL = getBackendBaseUrl();
const BACKEND_ORIGIN = (() => {
  try {
    return new URL(BACKEND_BASE_URL).origin;
  } catch {
    return null;
  }
})();

const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  const raw =
    window.localStorage?.getItem("reebs_auth_user")
    || window.sessionStorage?.getItem("reebs_auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setAuthToken = (token) => {
  if (typeof window === "undefined") return;
  window.__reebsAuthToken = typeof token === "string" ? token.trim() : "";
};

export const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  const stored = getStoredUser();
  const storedToken = typeof stored?.token === "string" ? stored.token.trim() : "";
  if (storedToken) return storedToken;
  const memoryToken = typeof window.__reebsAuthToken === "string" ? window.__reebsAuthToken.trim() : "";
  return memoryToken || null;
};

export const getOrganizationId = () => {
  if (typeof window === "undefined") return null;
  const stored = getStoredUser();
  const fromUser = parseOrganizationId(stored?.organizationId);
  if (fromUser) return fromUser;

  const params = new URLSearchParams(window.location.search || "");
  return parseOrganizationId(params.get("organizationId"));
};

const isNetlifyFunctionRequest = (url) => {
  if (typeof window === "undefined") return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname.startsWith("/.netlify/functions/");
  } catch {
    return false;
  }
};

const resolveBackendUrl = (url) => {
  if (typeof url !== "string") return url;
  if (!url.startsWith("/.netlify/functions/")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!BACKEND_BASE_URL) return url;
  try {
    return new URL(url, BACKEND_BASE_URL).toString();
  } catch {
    return url;
  }
};

const shouldAttachOrganizationId = (url) => {
  if (typeof window === "undefined") return false;
  try {
    const parsed = new URL(url, window.location.origin);
    if (!parsed.pathname.startsWith("/.netlify/functions/")) return false;
    if (parsed.origin === window.location.origin) return true;
    return BACKEND_ORIGIN ? parsed.origin === BACKEND_ORIGIN : false;
  } catch {
    return false;
  }
};

const appendOrganizationId = (url, organizationId) => {
  const parsed = new URL(url, window.location.origin);
  if (parsed.searchParams.has("organizationId")) return parsed.toString();
  parsed.searchParams.set("organizationId", String(organizationId));
  return parsed.toString();
};

export const patchOrganizationFetch = () => {
  if (typeof window === "undefined") return;
  if (window.__orgFetchPatched) return;
  if (typeof window.fetch !== "function") return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    const url = typeof input === "string" ? input : input?.url;
    if (!url || !isNetlifyFunctionRequest(url)) {
      return originalFetch(input, init);
    }

    const resolvedUrl = resolveBackendUrl(url);
    const shouldAttach = shouldAttachOrganizationId(resolvedUrl);
    const organizationId = shouldAttach ? getOrganizationId() : null;
    const token = shouldAttach ? getAuthToken() : null;
    const nextUrl = organizationId ? appendOrganizationId(resolvedUrl, organizationId) : resolvedUrl;
    const baseHeaders = input instanceof Request ? input.headers : init?.headers;
    const headers = new Headers(baseHeaders || {});
    if (organizationId && !headers.has("x-organization-id")) {
      headers.set("x-organization-id", String(organizationId));
    }
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (input instanceof Request) {
      const request = new Request(input, init);
      const requestWithUrl = new Request(nextUrl, request);
      const nextRequest = new Request(requestWithUrl, { headers });
      return originalFetch(nextRequest);
    }
    return originalFetch(nextUrl, { ...(init || {}), headers });
  };

  window.__orgFetchPatched = true;
};
