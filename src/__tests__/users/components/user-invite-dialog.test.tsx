// FE-6 (FR-28): the invitee-language combobox defaults to the current locale
// and the submitted InviteUserDTO carries `locale`.

import type { ReactNode } from "react";

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutate = vi.fn();

vi.mock("@/features/users/use-users", () => ({
  useInviteUser: () => ({ mutate, isPending: false }),
}));
vi.mock("@/features/departments/use-departments", () => ({
  useDepartments: () => ({ data: [], isLoading: false, error: null }),
  useRoles: () => ({ data: [], error: null }),
}));

vi.mock("@igrp/igrp-framework-react-design-system", async () => {
  const rhf = await import("react-hook-form");
  const Pass = ({ children }: { children?: ReactNode }) => <>{children}</>;
  const Div = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Badge: Div,
    Button: ({
      children,
      onClick,
      disabled,
      type,
    }: {
      children?: ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      type?: "button" | "submit";
    }) => (
      <button type={type ?? "button"} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
    Command: Div,
    CommandEmpty: Div,
    CommandGroup: Div,
    CommandInput: () => null,
    CommandItem: Div,
    CommandList: Div,
    Dialog: ({ open, children }: { open?: boolean; children?: ReactNode }) =>
      open ? <div role="dialog">{children}</div> : null,
    DialogContent: Div,
    DialogDescription: Div,
    DialogFooter: Div,
    DialogHeader: Div,
    DialogTitle: Div,
    Form: rhf.FormProvider,
    FormControl: Pass,
    FormField: rhf.Controller,
    FormItem: Div,
    FormLabel: ({ children }: { children?: ReactNode }) => (
      <span>{children}</span>
    ),
    FormMessage: () => null,
    IGRPCombobox: ({
      name,
      label,
      options,
    }: {
      name: string;
      label: string;
      options: { value: string; label: string }[];
    }) => {
      const { field } = rhf.useController({ name });
      return (
        <select
          aria-label={label}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    },
    IGRPIcon: () => null,
    Input: (props: Record<string, unknown>) => <input {...props} />,
    Popover: Div,
    PopoverContent: Div,
    PopoverTrigger: Pass,
    useIGRPToast: () => ({ igrpToast: vi.fn() }),
  };
});

import { UserInviteDialog } from "@/features/users/components/user-invite-dialog";

import { renderWithIntl } from "../../helpers/intl";

beforeEach(() => {
  mutate.mockReset();
});

async function fillAndSubmit() {
  await userEvent.type(
    screen.getByPlaceholderText("Ex: joao@email.com"),
    "ana@example.com",
  );
  const submit = screen.getByRole("button", { name: "Enviar Convite" });
  await waitFor(() => expect(submit).toBeEnabled());
  await userEvent.click(submit);
  await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
  return mutate.mock.calls[0]?.[0] as { user: Record<string, unknown> };
}

describe("UserInviteDialog — invitee language", () => {
  it("labels the combobox from messages and defaults to the current locale", () => {
    renderWithIntl(<UserInviteDialog open onOpenChange={() => {}} />, {
      locale: "en",
    });
    // en.json has no `users` namespace yet → pt fallback for the label.
    const combobox = screen.getByLabelText("Idioma do convidado");
    expect(combobox).toHaveValue("en");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Português",
      "English",
      "Français",
    ]);
  });

  it("sends the preselected locale in the DTO", async () => {
    renderWithIntl(<UserInviteDialog open onOpenChange={() => {}} />, {
      locale: "fr",
    });
    const { user } = await fillAndSubmit();
    expect(user).toEqual({
      email: "ana@example.com",
      departmentCode: "",
      roles: [],
      locale: "fr",
    });
  });

  it("sends the locale chosen by the inviter", async () => {
    renderWithIntl(<UserInviteDialog open onOpenChange={() => {}} />);
    await userEvent.selectOptions(
      screen.getByLabelText("Idioma do convidado"),
      "en",
    );
    const { user } = await fillAndSubmit();
    expect(user.locale).toBe("en");
  });
});
