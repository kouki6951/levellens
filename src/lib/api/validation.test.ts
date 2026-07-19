import { describe, expect, it } from "vitest";
import { validateSimplifyPayload } from "./validation";

const japaneseSource = "町の近くを流れる川は、人や生き物のくらしを支えています。学校の子どもたちは、春と秋に川の水を調べます。水の色やにおいを見て、川辺にいる魚や鳥、虫を数えます。雨がたくさん降った後は、水がにごり、ごみが遠くまで流れることがあります。調べたことを地図や表にまとめると、川の変化に気づきやすくなります。町の人もごみを減らし、水を大切に使うことで、川を守る活動に参加できます。調査の結果を発表すると、家族や地域の人にも川を守る方法が伝わります。";

describe("validateSimplifyPayload", () => {
  it("accepts a Japanese material and Japanese target levels", () => {
    const result = validateSimplifyPayload({
      sourceText: japaneseSource,
      lang: "ja",
      targetLevels: ["ja_sho1-2", "ja_sho5-6"],
      options: { questionCount: 3, questionType: "multiple_choice", glossEnabled: true },
    });

    expect(japaneseSource.length).toBeGreaterThanOrEqual(200);
    expect(result.ok).toBe(true);
  });

  it("treats a null source citation as no source citation", () => {
    const result = validateSimplifyPayload({
      sourceText: "A".repeat(200),
      source: null,
      lang: "en",
      targetLevels: ["en_g2-3"],
      options: { questionCount: 3, questionType: "multiple_choice", glossEnabled: true },
    });

    expect(result.ok).toBe(true);
  });
});
