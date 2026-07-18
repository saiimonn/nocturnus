export class ApiError extends Error {
  status: number
  code: string
  // Optional response headers. Only set by errors that need to tell the client
  // something the JSON body cannot carry — currently just Retry-After on 429.
  headers?: Record<string, string>

  constructor(
    status: number,
    code: string,
    message: string,
    headers?: Record<string, string>,
  ) {
    super(message)
    this.status = status
    this.code = code
    this.headers = headers
  }
}

export function badRequest(message: string) {
  return new ApiError(400, "bad_request", message)
}

export function unauthorized(message = "Authentication required") {
  return new ApiError(401, "unauthorized", message)
}

export function forbidden(message = "Not permitted") {
  return new ApiError(403, "forbidden", message)
}

export function notFound(message = "Not found") {
  return new ApiError(404, "not_found", message)
}

export function conflict(message: string) {
  return new ApiError(409, "conflict", message)
}

// Message is deliberately generic and identical across every rate-limited
// endpoint, so a 429 never reveals which check the caller tripped.
export function tooManyRequests(retryAfterSeconds: number) {
  return new ApiError(
    429,
    "too_many_requests",
    "Too many requests. Please try again later.",
    { "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))) },
  )
}

export function notImplemented(message = "Not implemented") {
  return new ApiError(501, "not_implemented", message)
}

export type RouteContext<T> = { params: Promise<T> }

type Handler<C> = (request: Request, context: C) => Promise<Response>

export function handle<C = unknown>(fn: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await fn(request, context)
    } catch (e) {
      if (e instanceof ApiError) {
        return Response.json(
          { error: e.code, message: e.message },
          { status: e.status, ...(e.headers ? { headers: e.headers } : {}) },
        )
      }
      const message = e instanceof Error ? e.message : String(e)
      return Response.json({ error: "internal_error", message }, { status: 500 })
    }
  }
}

export function fromDb<T>(result: {
  data: T | null
  error: { code?: string; message: string } | null
}): NonNullable<T> {
  if (result.error) {
    throw new ApiError(500, result.error.code ?? "db_error", result.error.message)
  }
  if (result.data === null || result.data === undefined) {
    throw notFound()
  }
  return result.data as NonNullable<T>
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    throw badRequest("Request body must be valid JSON")
  }
}

export function requireFields(body: Record<string, unknown>, fields: string[]) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null)
  if (missing.length > 0) {
    throw badRequest(`Missing required field(s): ${missing.join(", ")}`)
  }
}
