/**
 * Domain errors thrown by services. UI code maps them to Danish messages; the
 * `message` itself is meant for logs and developers.
 */
export type DomainErrorCode = "not_found" | "forbidden" | "validation" | "conflict" | "unauthenticated";

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id?: string) {
    super("not_found", `${entity} not found${id ? `: ${id}` : ""}`, { entity, id });
  }
}

export class ForbiddenError extends DomainError {
  constructor(reason: string) {
    super("forbidden", `Forbidden: ${reason}`);
  }
}

export class UnauthenticatedError extends DomainError {
  constructor() {
    super("unauthenticated", "Not signed in");
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("validation", message, details);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super("conflict", message);
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
