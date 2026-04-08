const AUTH_STORAGE_KEY = 'ritmoAuth';

export function getAuthSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    clearAuthSession();
    return null;
  }
}

export function saveAuthSession(authResponse) {
  const session = {
    token: authResponse.token,
    expiresAt: authResponse.expiresAt,
    usuario: authResponse.usuario,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getLoggedUser() {
  return getAuthSession()?.usuario ?? null;
}
