import { ApiError } from "./api";

/** HTTP status of an unknown thrown value, or null when it is not an ApiError. */
export function httpStatus(error: unknown): number | null {
  return error instanceof ApiError ? error.status : null;
}

/** Human-readable fallback for network/unknown failures. */
export function fallbackMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "Network error. Please try again.";
}
