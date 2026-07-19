import { describe, expect, it } from "vitest";
import { isPipelineStalled } from "./pipeline-health";

describe("isPipelineStalled", () => {
  const startedAt = new Date("2026-07-19T08:00:00.000Z");

  it("does not abandon a pipeline before its configured inactivity window", () => {
    expect(isPipelineStalled(startedAt, new Date("2026-07-19T08:02:59.999Z"), 180_000)).toBe(false);
  });

  it("detects a pipeline with no progress after its inactivity window", () => {
    expect(isPipelineStalled(startedAt, new Date("2026-07-19T08:03:00.000Z"), 180_000)).toBe(true);
  });
});
