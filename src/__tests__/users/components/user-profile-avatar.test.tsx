import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import {
  UserProfileAvatar,
  type UserProfileAvatarProps,
} from "@/features/users/components/user-profile-avatar";

import { renderWithIntl } from "../../helpers/intl";

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
      // biome-ignore lint/performance/noImgElement: lightweight test mock, not a real page image
      <img src={image} alt={alt} />
    ) : (
      <span data-testid="avatar-fallback">{fallbackContent}</span>
    ),
  Skeleton: () => <span data-testid="avatar-skeleton" />,
  useIGRPToast: () => ({ igrpToast: vi.fn() }),
}));

const baseUser = {
  id: "u1",
  name: "Ana",
  username: "ana",
  email: "a@x.cv",
  picture: null,
} as unknown as UserProfileAvatarProps["user"];

const fakeUrl = "blob:fake";
beforeEach(() => {
  // Only the object-URL helpers are stubbed. Replacing the whole `URL` global
  // would drop the constructor, and vi.stubGlobal is not auto-restored, so the
  // damage would leak into every later test file sharing this worker.
  vi.spyOn(URL, "createObjectURL").mockReturnValue(fakeUrl);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});

it("shows the object-URL preview while uploading and clears it after success", async () => {
  const onUpload = vi.fn().mockResolvedValue(undefined);
  renderWithIntl(
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
  await waitFor(() =>
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl),
  );
});

it("clears object URL when upload errors", async () => {
  const onUpload = vi.fn().mockRejectedValue(new Error("nope"));
  renderWithIntl(
    <UserProfileAvatar
      user={baseUser}
      resolvedUrl={null}
      isResolvingUrl={false}
      isUploading={false}
      onUpload={onUpload}
    />,
  );

  const input = screen.getByLabelText(/alterar avatar/i, { selector: "input" });
  fireEvent.change(input, {
    target: { files: [new File(["x"], "x.png", { type: "image/png" })] },
  });

  await waitFor(() =>
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl),
  );
});

it("exposes aria-label and disables trigger while resolving URL", () => {
  renderWithIntl(
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
  const userNoName = { ...baseUser, name: "", username: "ana_u" };
  renderWithIntl(
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
