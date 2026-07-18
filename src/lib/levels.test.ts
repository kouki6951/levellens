import { describe, expect, it } from "vitest";
import { compareLevelCodes } from "./levels";

describe("compareLevelCodes", () => {
  it("orders Japanese levels from lower to higher difficulty", () => {
    expect(["ja_jlpt_n4n3", "ja_sho5-6", "ja_sho1-2", "ja_sho3-4"].sort(compareLevelCodes)).toEqual([
      "ja_sho1-2",
      "ja_sho3-4",
      "ja_sho5-6",
      "ja_jlpt_n4n3",
    ]);
  });
});
