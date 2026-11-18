import { describe, expect, it } from "vitest";

import { diffPermissions } from "@/features/roles/permission-diff";

const p = (name: string) => ({ name });

describe("diffPermissions", () => {
  it("adds what was selected and removes what was unselected", () => {
    expect(
      diffPermissions(
        [p("users.read"), p("apps.edit")],
        [p("users.read"), p("users.delete")],
      ),
    ).toEqual({ toAdd: ["apps.edit"], toRemove: ["users.delete"] });
  });

  it("treats case and surrounding spaces as the same permission", () => {
    expect(diffPermissions([p(" Users.Read ")], [p("users.read")])).toEqual({
      toAdd: [],
      toRemove: [],
    });
  });

  it("removes with the name the API sent, not the normalised one", () => {
    expect(diffPermissions([], [p("Users.Delete")]).toRemove).toEqual([
      "Users.Delete",
    ]);
  });

  it("sends a duplicated selection once and skips empty names", () => {
    expect(diffPermissions([p("a"), p("A"), p("")], []).toAdd).toEqual(["A"]);
  });

  it("removes everything when nothing is selected", () => {
    expect(diffPermissions([], [p("a"), p("b")])).toEqual({
      toAdd: [],
      toRemove: ["a", "b"],
    });
  });
});
