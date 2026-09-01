// Route wrapper: takes an async function that returns a plain object, and
// turns any ApiError / ZodError / unexpected throw into a JSON response.

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./errors";

export type ApiHandler<T> = () => Promise<T>;

export async function json<T>(fn: ApiHandler<T>): Promise<NextResponse> {
  try {
    const value = await fn();
    return NextResponse.json(value);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message, details: err.details } },
        { status: err.status },
      );
    }
    if (err instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "invalid_input",
            message: "Request failed validation",
            details: err.flatten(),
          },
        },
        { status: 400 },
      );
    }
    // Unexpected. Log server-side; return a generic 500.
    console.error("[api] unhandled error", err);
    return NextResponse.json(
      { error: { code: "internal", message: "Something went wrong" } },
      { status: 500 },
    );
  }
}
