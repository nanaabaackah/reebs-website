const parseOrganizationId = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const getStoredUser = () => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage?.getItem("reebs_auth_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const getOrganizationId = () => {
  if (typeof window === "undefined") return null;
  const stored = getStoredUser();
  const fromUser = parseOrganizationId(stored?.organizationId);
  if (fromUser) return fromUser;

  const params = new URLSearchParams(window.location.search || "");
  return parseOrganizationId(params.get("organizationId"));
};

const shouldAttachOrganizationId = (url) => {
  if (typeof window === "undefined") return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return (
      parsed.origin === window.location.origin &&
      parsed.pathname.startsWith("/.netlify/functions/")
    );
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
    const organizationId = getOrganizationId();
    const url = typeof input === "string" ? input : input?.url;
    if (!organizationId || !url || !shouldAttachOrganizationId(url)) {
      return originalFetch(input, init);
    }
    const nextUrl = appendOrganizationId(url, organizationId);
    if (input instanceof Request) {
      return originalFetch(new Request(nextUrl, input), init);
    }
    return originalFetch(nextUrl, init);
  };

  window.__orgFetchPatched = true;
};
