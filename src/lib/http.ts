import { NextResponse } from "next/server";

// Small helpers for consistent JSON API responses and error handling.

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wrap a route handler so unexpected exceptions become clean 500s instead of
 * leaking stack traces to the client.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("Unhandled API error:", err);
      return error("Something went wrong. Please try again.", 500);
    }
  };
}
