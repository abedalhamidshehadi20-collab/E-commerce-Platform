const STORAGE_KEY = "ecommerce_platform_tokens";

export function getStoredTokens() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { access: "", refresh: "" };
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { access: "", refresh: "" };
  }
}

export function setStoredTokens(tokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

export function clearStoredTokens() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasStoredTokens() {
  const { access, refresh } = getStoredTokens();
  return Boolean(access || refresh);
}

export function getAccessToken() {
  return getStoredTokens().access || "";
}

export function getRefreshToken() {
  return getStoredTokens().refresh || "";
}
