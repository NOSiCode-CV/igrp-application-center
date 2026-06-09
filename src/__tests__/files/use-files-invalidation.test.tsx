import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { filesKeys } from "@/features/files/query-keys";
import {
  useUploadPrivateFiles,
  useUploadPublicFiles,
} from "@/features/files/use-files";

vi.mock("@/actions/file", () => ({
  getFileUrl: vi.fn(),
  uploadPublicFile: vi.fn(async () => ({
    success: true,
    data: "avatars/user-1.png",
  })),
  uploadPrivateFile: vi.fn(async () => ({
    success: true,
    data: "docs/contract.pdf",
  })),
}));

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("useUploadPublicFiles", () => {
  it("invalidates the files key prefix on success", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useUploadPublicFiles(), {
      wrapper: makeWrapper(client),
    });

    await result.current.mutateAsync({
      file: new Blob(["x"]),
      options: { folder: "avatars" },
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: filesKeys.all });
    });
  });
});

describe("useUploadPrivateFiles", () => {
  it("invalidates the files key prefix on success", async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const spy = vi.spyOn(client, "invalidateQueries");

    const { result } = renderHook(() => useUploadPrivateFiles(), {
      wrapper: makeWrapper(client),
    });

    await result.current.mutateAsync({
      file: new Blob(["x"]),
      options: { folder: "docs" },
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: filesKeys.all });
    });
  });
});
