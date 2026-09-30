import { renderHook } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toast = vi.fn();
vi.mock("@igrp/igrp-framework-react-design-system", async (orig) => ({
  ...(await orig<typeof import("@igrp/igrp-framework-react-design-system")>()),
  useIGRPToast: () => ({ igrpToast: toast }),
}));

import { useCopyClientId } from "@/features/oauth-clients/use-copy-client-id";

beforeEach(() => {
  toast.mockClear();
  userEvent.setup(); // installs a clipboard stub on navigator
});

describe("useCopyClientId", () => {
  it("copies the client ID and confirms", async () => {
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    const { result } = renderHook(() => useCopyClientId());
    await result.current("my-invoice");
    expect(writeText).toHaveBeenCalledWith("my-invoice");
    expect(toast).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "success", title: "Copiado" }),
    );
  });

  it("shows an error toast when the clipboard write fails", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
      new Error("denied"),
    );
    const { result } = renderHook(() => useCopyClientId());
    await expect(result.current("my-invoice")).resolves.toBeUndefined();
    expect(toast).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: "error",
        title: "Não foi possível copiar",
      }),
    );
  });
});
