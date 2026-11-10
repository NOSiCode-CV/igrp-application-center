import { describe, expect, it } from "vitest";

import {
  imageUploadProblem,
  MAX_IMAGE_UPLOAD_BYTES,
} from "@/features/files/upload-rules";

describe("imageUploadProblem", () => {
  it("aceita imagens e ICO sem tipo", () => {
    expect(
      imageUploadProblem(new File(["x"], "a.png", { type: "image/png" })),
    ).toBeNull();
    expect(imageUploadProblem(new File(["x"], "favicon.ico"))).toBeNull();
  });

  it("recusa o que não é imagem", () => {
    expect(
      imageUploadProblem(new File(["x"], "a.html", { type: "text/html" })),
    ).toBe("notImage");
    expect(imageUploadProblem(new Blob(["x"]))).toBe("notImage");
  });

  it("recusa acima do limite", () => {
    const big = new File(
      [new Uint8Array(MAX_IMAGE_UPLOAD_BYTES + 1)],
      "a.png",
      {
        type: "image/png",
      },
    );
    expect(imageUploadProblem(big)).toBe("tooLarge");
  });
});
