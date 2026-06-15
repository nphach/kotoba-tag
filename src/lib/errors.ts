export class ModelLoadingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelLoadingError";
  }
}

export class GameCompleteError extends Error {
  constructor() {
    super("no more words available");
    this.name = "GameCompleteError";
  }
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getErrorMessage(
  error: unknown,
  fallback = "something went wrong — please try again",
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export async function readApiErrorDetail(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = await response.json();
    const detail = body?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item) {
            return String(item.msg);
          }
          return null;
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join("; ");
      }
    }
  } catch {
    // response body wasn't JSON — use fallback
  }

  return fallback;
}
