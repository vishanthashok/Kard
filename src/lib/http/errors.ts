// Typed errors that the API route wrapper converts into JSON responses.

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Sugar for the common cases.
export const badRequest = (msg: string, details?: unknown) =>
  new ApiError(400, "bad_request", msg, details);
export const unauthorized = (msg = "Sign in required") =>
  new ApiError(401, "unauthenticated", msg);
export const forbidden = (msg = "Not allowed") =>
  new ApiError(403, "forbidden", msg);
export const notFound = (msg = "Not found") =>
  new ApiError(404, "not_found", msg);
export const conflict = (msg: string) => new ApiError(409, "conflict", msg);
