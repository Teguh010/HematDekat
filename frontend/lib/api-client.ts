import type { z } from "zod";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiFetchOptions<T> = {
  method?: HttpMethod;
  body?: unknown;
  schema: z.ZodType<T>;
  signal?: AbortSignal;
};

function getBaseUrl(): string {
  const serverUrl = typeof window === "undefined" ? process.env.BACKEND_INTERNAL_URL : undefined;
  const url = serverUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  return url.replace(/\/$/, "");
}

function toApiError(status: number, payload: unknown): ApiError {
  const body = (payload ?? {}) as { message?: unknown; errors?: unknown };
  const message =
    typeof body.message === "string"
      ? body.message
      : Array.isArray(body.message)
        ? body.message.join(", ")
        : `Request failed with status ${status}`;

  const fieldErrors: Record<string, string> = {};
  if (Array.isArray(body.errors)) {
    for (const item of body.errors) {
      if (item && typeof item === "object" && "path" in item && "message" in item) {
        fieldErrors[String(item.path)] = String(item.message);
      }
    }
  }

  return new ApiError(status, message, fieldErrors);
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions<T>): Promise<T> {
  const { method = "GET", body, schema, signal } = options;

  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    throw new ApiError(0, error instanceof Error ? error.message : "Network error");
  }

  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(response.status, `Unexpected response shape from ${path}`);
  }

  return parsed.data;
}

export function getApiBaseUrl() {
  return getBaseUrl();
}
