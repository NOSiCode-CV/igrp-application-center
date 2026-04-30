export type Step =
  | { kind: "bootstrapping" }
  | { kind: "invalid-invitation" }
  | { kind: "email-mismatch" }
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
  | { type: "bootstrap-ok-no-claim" }
  | { type: "bootstrap-ok-matches" }
  | { type: "bootstrap-ok-mismatch" }
  | { type: "bootstrap-fail" }
  | { type: "email-validated"; email: string }
  | { type: "email-error"; message: string }
  | { type: "otp-validated" }
  | { type: "otp-error"; message: string }
  | { type: "resend-sent" }
  | { type: "change-email" }
  | { type: "rejected" };

export const RESEND_COOLDOWN_MS = 60_000;

export const initialStep: Step = { kind: "bootstrapping" };

export function inviteFlowReducer(state: Step, action: Action): Step {
  switch (action.type) {
    case "bootstrap-ok-no-claim":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "email-entry" };

    case "bootstrap-ok-matches":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "response" };

    case "bootstrap-ok-mismatch":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "email-mismatch" };

    case "bootstrap-fail":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "invalid-invitation" };

    case "email-validated":
      if (state.kind !== "email-entry") return state;
      return {
        kind: "otp-entry",
        email: action.email,
        lastSentAt: Date.now(),
      };

    case "email-error":
      if (state.kind !== "email-entry") return state;
      return { kind: "email-entry", error: action.message };

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
