import type { ServiceAccountInput } from "@/actions/service-accounts";
import type { OAuthClientFormValues } from "@/features/oauth-clients/oauth-client-schemas";

import type { ServiceAccountIdentityValues } from "../service-account-schemas";
import { formatAccessSummary } from "./service-account-utils";

export type WizardStep = 1 | 2 | 3;

export type ClientChoice =
  | { kind: "existing"; oauthClientId: string }
  | { kind: "new"; values: OAuthClientFormValues };

export type PickedRole = { id: number; code: string; departmentCode: string };
export type PickedPermission = {
  id: number;
  name: string;
  departmentCode: string;
};

/** Nothing is persisted until the final submit (spec §5.4). */
export interface WizardState {
  step: WizardStep;
  client?: ClientChoice;
  identity?: ServiceAccountIdentityValues;
  roles: PickedRole[];
  permissions: PickedPermission[];
}

export type WizardAction =
  | { type: "chooseClient"; client: ClientChoice }
  | { type: "setIdentity"; identity: ServiceAccountIdentityValues }
  | { type: "setRoles"; roles: PickedRole[] }
  | { type: "setPermissions"; permissions: PickedPermission[] }
  | { type: "goTo"; step: WizardStep };

export function initialWizardState(oauthClientId?: string): WizardState {
  return oauthClientId
    ? {
        step: 2,
        client: { kind: "existing", oauthClientId },
        roles: [],
        permissions: [],
      }
    : { step: 1, roles: [], permissions: [] };
}

export function canGoTo(state: WizardState, step: WizardStep): boolean {
  if (step === 1) return true;
  if (step === 2) return !!state.client;
  return !!state.client && !!state.identity;
}

export function wizardReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  switch (action.type) {
    case "chooseClient":
      return { ...state, client: action.client, step: 2 };
    case "setIdentity":
      return { ...state, identity: action.identity, step: 3 };
    case "setRoles":
      return { ...state, roles: action.roles };
    case "setPermissions":
      return { ...state, permissions: action.permissions };
    case "goTo":
      return canGoTo(state, action.step)
        ? { ...state, step: action.step }
        : state;
  }
}

export function toAccountInput(
  state: WizardState,
): Omit<ServiceAccountInput, "oauthClientId"> {
  if (!state.identity) throw new Error("Wizard identity step not completed");
  return {
    name: state.identity.name.trim(),
    description: state.identity.description.trim() || undefined,
    active: state.identity.active,
    roleIds: state.roles.map((r) => r.id),
    permissionIds: state.permissions.map((p) => p.id),
  };
}

export function stepSummary(
  state: WizardState,
  step: WizardStep,
  clientLabel?: (oauthClientId: string) => string,
): string | undefined {
  if (step === 1) {
    if (!state.client) return undefined;
    return state.client.kind === "new"
      ? `Novo: ${state.client.values.clientId}`
      : (clientLabel?.(state.client.oauthClientId) ??
          state.client.oauthClientId);
  }
  if (step === 2) return state.identity?.name.trim();
  return state.identity
    ? formatAccessSummary(state.roles.length, state.permissions.length)
    : undefined;
}
