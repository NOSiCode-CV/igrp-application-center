import { describe, expect, it } from "vitest";

import { oauthClientFormSchema } from "@/features/oauth-clients/oauth-client-schemas";
import {
  emptyIdentityValues,
  machineClientFormValues,
  serviceAccountIdentitySchema,
} from "@/features/service-accounts/service-account-schemas";

function issues(values: unknown) {
  const r = serviceAccountIdentitySchema.safeParse(values);
  return r.success
    ? []
    : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

describe("serviceAccountIdentitySchema", () => {
  it("requires a name", () => {
    expect(issues(emptyIdentityValues())).toEqual(["name: Indique o nome."]);
  });
  it("accepts name and description at their column limits", () => {
    expect(
      issues({
        name: "x".repeat(180),
        description: "y".repeat(500),
        active: true,
      }),
    ).toEqual([]);
  });

  it("caps name at 180 and description at 500", () => {
    expect(
      issues({
        ...emptyIdentityValues(),
        name: "x".repeat(181),
        description: "y".repeat(501),
      }),
    ).toEqual([
      "name: Até 180 caracteres.",
      "description: Até 500 caracteres.",
    ]);
  });

  it("accepts a valid identity", () => {
    expect(issues({ name: "Nightly", description: "", active: true })).toEqual(
      [],
    );
  });
});

describe("machineClientFormValues", () => {
  it("is a client_credentials-only client with no scopes", () => {
    const v = machineClientFormValues();
    expect(v.grantTypes).toEqual(["client_credentials"]);
    expect(v.scopes).toEqual([]);
  });
  it("validates once clientId and name are filled", () => {
    const r = oauthClientFormSchema.safeParse({
      ...machineClientFormValues(),
      clientId: "nightly-etl",
      clientName: "Nightly ETL",
    });
    expect(r.success).toBe(true);
  });
});
