import { describe, expect, it } from "vitest";

import {
  canGoTo,
  initialWizardState,
  stepSummary,
  toAccountInput,
  wizardReducer,
} from "@/features/service-accounts/lib/wizard-state";
import { machineClientFormValues } from "@/features/service-accounts/service-account-schemas";

const identity = { name: " Nightly ETL ", description: "", active: true };

describe("wizard state", () => {
  it("starts at step 1, or at step 2 with a deep-linked client", () => {
    expect(initialWizardState().step).toBe(1);
    expect(initialWizardState("c1")).toMatchObject({
      step: 2,
      client: { kind: "existing", oauthClientId: "c1" },
    });
  });

  it("advances as each step is completed", () => {
    let s = initialWizardState();
    s = wizardReducer(s, {
      type: "chooseClient",
      client: { kind: "existing", oauthClientId: "c1" },
    });
    expect(s.step).toBe(2);
    s = wizardReducer(s, { type: "setIdentity", identity });
    expect(s.step).toBe(3);
  });

  it("only jumps back to reachable steps", () => {
    const s = initialWizardState();
    expect(canGoTo(s, 1)).toBe(true);
    expect(canGoTo(s, 2)).toBe(false);
    expect(wizardReducer(s, { type: "goTo", step: 3 }).step).toBe(1);
    const done = wizardReducer(
      wizardReducer(s, {
        type: "chooseClient",
        client: { kind: "existing", oauthClientId: "c1" },
      }),
      { type: "setIdentity", identity },
    );
    expect(wizardReducer(done, { type: "goTo", step: 1 }).step).toBe(1);
    // Going back keeps later answers.
    expect(wizardReducer(done, { type: "goTo", step: 1 }).identity).toEqual(
      identity,
    );
  });

  it("builds the account input from identity and access", () => {
    let s = wizardReducer(initialWizardState("c1"), {
      type: "setIdentity",
      identity,
    });
    s = wizardReducer(s, {
      type: "setRoles",
      roles: [{ id: 1, code: "r", departmentCode: "D" }],
    });
    s = wizardReducer(s, {
      type: "setPermissions",
      permissions: [{ id: 9, name: "p", departmentCode: "D" }],
    });
    expect(toAccountInput(s)).toEqual({
      name: "Nightly ETL",
      description: undefined,
      active: true,
      roleIds: [1],
      permissionIds: [9],
    });
  });

  it("summarises completed steps", () => {
    const newClient = wizardReducer(initialWizardState(), {
      type: "chooseClient",
      client: {
        kind: "new",
        values: { ...machineClientFormValues(), clientId: "nightly-etl-m2m" },
      },
    });
    expect(stepSummary(newClient, 1)).toBe("Novo: nightly-etl-m2m");
    const existing = initialWizardState("c1");
    expect(stepSummary(existing, 1, () => "etl-runner")).toBe("etl-runner");
    const withIdentity = wizardReducer(existing, {
      type: "setIdentity",
      identity,
    });
    expect(stepSummary(withIdentity, 2)).toBe("Nightly ETL");
    expect(stepSummary(withIdentity, 3)).toBe("0 perfis · 0 diretas");
    expect(stepSummary(initialWizardState(), 2)).toBeUndefined();
  });

  it("keeps an unconfirmed identity draft without completing step 2", () => {
    const draft = { name: "Nightly", description: "", active: true };
    const s1 = wizardReducer(initialWizardState("c1"), {
      type: "saveIdentityDraft",
      identity: draft,
    });
    expect(s1.identityDraft).toEqual(draft);
    expect(canGoTo(s1, 3)).toBe(false);

    const s2 = wizardReducer(s1, { type: "setIdentity", identity: draft });
    expect(s2.identity).toEqual(draft);
    expect(s2.identityDraft).toBeUndefined();
  });
});
