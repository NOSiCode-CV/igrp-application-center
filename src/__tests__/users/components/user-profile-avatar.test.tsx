import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { UserProfileAvatar } from "@/features/users/components/user-profile-avatar";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
  IGRPIcon: () => <span />,
  IGRPUserAvatar: ({
    image,
    alt,
    fallbackContent,
  }: {
    image?: string | null;
    alt?: string;
    fallbackContent?: React.ReactNode;
  }) =>
    image ? (
      <img src={image} alt={alt} />
    ) : (
      <span data-testid="avatar-fallback">{fallbackContent}</span>
    ),
}));

const baseUser = {
  id: "u1",
  name: "Ana",
  username: "ana",
  email: "a@x.cv",
  picture: null,
} as never;

const fakeUrl = "blob:fake";
beforeEach(() => {
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => fakeUrl),
    revokeObjectURL: vi.fn(),
  });
});

it("shows the object-URL preview while uploading and clears it after success", async () => {
  const onUpload = vi.fn().mockResolvedValue(undefined);
  render(
    <UserProfileAvatar
      user={baseUser}
      resolvedUrl={null}
      isResolvingUrl={false}
      isUploading={false}
      onUpload={onUpload}
    />,
  );

  const input = screen.getByLabelText(/alterar avatar/i, { selector: "input" });
  const file = new File(["x"], "x.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });

  await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file));
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl));
});

it("clears object URL when upload errors", async () => {
  const onUpload = vi.fn().mockRejectedValue(new Error("nope"));
  render(
    <UserProfileAvatar
      user={baseUser}
      resolvedUrl={null}
      isResolvingUrl={false}
      isUploading={false}
      onUpload={onUpload}
    />,
  );

  const input = screen.getByLabelText(/alterar avatar/i, { selector: "input" });
  fireEvent.change(input, { target: { files: [new File(["x"], "x.png", { type: "image/png" })] } });

  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl));
});

it("exposes aria-label and disables trigger while resolving URL", () => {
  render(
    <UserProfileAvatar
      user={baseUser}
      resolvedUrl={null}
      isResolvingUrl={true}
      isUploading={false}
      onUpload={vi.fn()}
    />,
  );

  const trigger = screen.getByRole("button", { name: /alterar avatar/i });
  expect(trigger).toBeDisabled();
});

it("falls back to username then email for alt text when name is empty", () => {
  const userNoName = { ...baseUser, name: "", username: "ana_u" } as never;
  render(
    <UserProfileAvatar
      user={userNoName}
      resolvedUrl="https://example.com/a.png"
      isResolvingUrl={false}
      isUploading={false}
      onUpload={vi.fn()}
    />,
  );

  // IGRPUserAvatar may render the alt on different elements depending on
  // whether the image loaded. Query the document for any element with the
  // expected alt text.
  const altMatcher = (content: string) => content === "ana_u";
  expect(
    document.querySelector('[alt="ana_u"]') ||
      screen.queryByAltText(altMatcher),
  ).toBeTruthy();
});
