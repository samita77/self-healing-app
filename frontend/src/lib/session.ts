/**
 * Token storage and the global "session expired" hook.
 *
 * Kept free of React imports so `lib/api.ts` can use it without creating a
 * cycle through the router/query client.
 */

const TOKEN_KEY = "self-healing.token";

let unauthorizedHandler: (() => void) | null = null;

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
  has(): boolean {
    return Boolean(this.get());
  },
};

export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

/**
 * Called by the API layer on any 401. Clears the token and lets `main.tsx`
 * clear the query cache and redirect to /login.
 */
export function handleUnauthorized(): void {
  tokenStore.clear();
  unauthorizedHandler?.();
}
