export type ActionErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DB"
  | "AI"
  | "UNKNOWN";

export type ActionError = {
  code: ActionErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type Success<T> = { ok: true; data: T };
export type Failure = { ok: false; error: ActionError };

export type Result<T, _E = ActionError> = Success<T> | Failure;

export function ok<T>(data: T): Success<T> {
  return { ok: true, data };
}

export function err(error: ActionError): Failure {
  return { ok: false, error };
}

export function isOk<T>(result: Result<T>): result is Success<T> {
  return result.ok;
}

export function isErr<T>(result: Result<T>): result is Failure {
  return !result.ok;
}
