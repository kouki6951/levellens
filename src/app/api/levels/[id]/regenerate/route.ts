import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";
import { runInBackground } from "@/lib/background";
import { prisma } from "@/lib/db";
import { runPipelineForLevel } from "@/lib/pipeline";

export const maxDuration = 60;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const level = await prisma.levelVersion.findUnique({ where: { id }, select: { id: true, status: true, inRange: true } });
  if (!level) return apiError("LEVEL_NOT_FOUND");
  if (level.status !== "failed" && !(level.status === "completed" && level.inRange === false)) {
    return apiError("LEVEL_NOT_READY", "Only failed or near-match levels can be regenerated.");
  }

  runInBackground(runPipelineForLevel(level.id));
  return NextResponse.json({ levelVersionId: level.id, status: "converting" }, { status: 202 });
}
