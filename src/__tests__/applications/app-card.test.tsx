import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { afterEach, describe, expect, it, vi } from "vitest";

const image = vi.fn((_props: { src: string }) => null);
vi.mock("next/image", () => ({
  default: (props: { src: string }) => image(props),
}));
vi.mock("@/components/button-link-tooltip", () => ({
  ButtonLinkTooltip: () => null,
}));

import { render, screen } from "@testing-library/react";

const app = (picture?: string) =>
  ({
    code: "ALPHA",
    name: "Alpha",
    status: "ACTIVE",
    picture,
  }) as unknown as ApplicationDTO;

async function renderCard(minioUrl: string, picture?: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_IGRP_MINIO_URL", minioUrl);
  const { ApplicationCard } = await import(
    "@/features/applications/components/app-card"
  );
  render(<ApplicationCard app={app(picture)} />);
}

afterEach(() => {
  vi.unstubAllEnvs();
  image.mockClear();
});

describe("ApplicationCard picture", () => {
  it("shows the initial, not a crash, when no MinIO base is configured", async () => {
    await renderCard("", "public/ALPHA/logo.png");
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(image).not.toHaveBeenCalled();
  });

  it("keeps the bucket path of the MinIO base", async () => {
    await renderCard("https://minio.example/igrp", "public/ALPHA/logo.png");
    expect(image).toHaveBeenCalledWith(
      expect.objectContaining({
        src: "https://minio.example/igrp/public/ALPHA/logo.png",
      }),
    );
  });
});
