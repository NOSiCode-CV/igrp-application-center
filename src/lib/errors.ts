export type {
  PublicErrorId,
  PublicErrorMessage,
} from "@igrp/framework-next/app-error";
export {
  AppError,
  getDisplayableErrorMessage,
  PUBLIC_ERROR_DELIMITER,
  parsePublicDigest,
} from "@igrp/framework-next/app-error";

export { logger } from "@igrp/framework-next/logger";

export class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly missingVars: string[] = [],
  ) {
    super(message);
    this.name = "EnvValidationError";
    Object.setPrototypeOf(this, EnvValidationError.prototype);
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}
