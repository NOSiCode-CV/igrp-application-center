export type Step =
  | { kind: "bootstrapping" }
  | { kind: "invalid-invitation"; message?: string }
  | { kind: "email-mismatch"; message?: string }
  | { kind: "token-expired"; message?: string }
  | { kind: "email-auto-submit"; email: string }
  | { kind: "email-entry"; error?: string }
  | {
      kind: "otp-entry";
      email: string;
      otpError?: string;
      lastSentAt: number;
    }
  | { kind: "response" }
  | { kind: "rejected" };

export type Action =
  | { type: "bootstrap-ok-has-email"; email: string }
  | { type: "bootstrap-ok-no-claim" }
  | { type: "bootstrap-fail"; message?: string }
  | { type: "bootstrap-expired"; message?: string }
  | { type: "email-validated"; email: string }
  | { type: "email-error"; message: string }
  | { type: "email-mismatch"; message?: string }
  | { type: "token-expired"; message?: string }
  | { type: "otp-validated" }
  | { type: "otp-error"; message: string }
  | { type: "resend-sent" }
  | { type: "change-email" }
  | { type: "rejected" };

export const RESEND_COOLDOWN_MS = 60_000;

export const initialStep: Step = { kind: "bootstrapping" };

const EXPIRED_PATTERNS = [/expir/i, /expirado/i, /caduc/i];
const MISMATCH_PATTERNS = [
  /mismatch/i,
  /não corresponde/i,
  /nao corresponde/i,
  /não pertence/i,
  /nao pertence/i,
  /does not match/i,
  /email.*inválido/i,
  /email.*invalido/i,
];

export type InviteErrorClass = "expired" | "mismatch" | "other";

export function classifyInviteError(
  message: string | undefined | null,
): InviteErrorClass {
  if (!message) return "other";
  if (EXPIRED_PATTERNS.some((re) => re.test(message))) return "expired";
  if (MISMATCH_PATTERNS.some((re) => re.test(message))) return "mismatch";
  return "other";
}

export function inviteFlowReducer(state: Step, action: Action): Step {
  switch (action.type) {
    case "bootstrap-ok-no-claim":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "email-entry" };

    case "bootstrap-ok-has-email":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "email-auto-submit", email: action.email };

    case "bootstrap-fail":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "invalid-invitation", message: action.message };

    case "bootstrap-expired":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "token-expired", message: action.message };

    case "email-validated":
      if (state.kind !== "email-entry" && state.kind !== "email-auto-submit")
        return state;
      return {
        kind: "otp-entry",
        email: action.email,
        lastSentAt: Date.now(),
      };

    case "email-error":
      if (state.kind !== "email-entry" && state.kind !== "email-auto-submit")
        return state;
      return { kind: "email-entry", error: action.message };

    case "email-mismatch":
      return { kind: "email-mismatch", message: action.message };

    case "token-expired":
      return { kind: "token-expired", message: action.message };

    case "otp-validated":
      if (state.kind !== "otp-entry") return state;
      return { kind: "response" };

    case "otp-error":
      if (state.kind !== "otp-entry") return state;
      return {
        kind: "otp-entry",
        email: state.email,
        otpError: action.message,
        lastSentAt: state.lastSentAt,
      };

    case "resend-sent":
      if (state.kind !== "otp-entry") return state;
      return {
        kind: "otp-entry",
        email: state.email,
        lastSentAt: Date.now(),
      };

    case "change-email":
      if (state.kind !== "otp-entry") return state;
      return { kind: "email-entry" };

    case "rejected":
      if (state.kind !== "response") return state;
      return { kind: "rejected" };

    default:
      return state;
  }
}
