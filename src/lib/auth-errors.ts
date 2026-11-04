import { da } from "@/messages/da";

/** Maps Better Auth client error codes to Danish messages. */
export function authErrorMessage(error: { code?: string; status?: number } | null | undefined): string {
  if (!error) return da.auth.errors.generic;
  if (error.status === 429) return da.auth.errors.tooManyRequests;
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_EMAIL":
    case "INVALID_PASSWORD":
      return da.auth.errors.invalidCredentials;
    case "EMAIL_NOT_VERIFIED":
      return da.auth.errors.emailNotVerified;
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return da.auth.errors.userExists;
    case "PASSWORD_TOO_SHORT":
      return da.auth.errors.passwordTooShort;
    default:
      return da.auth.errors.generic;
  }
}
