import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_PIPELINE_STALL_TIMEOUT_MS = 180_000;
const ACTIVE_LEVEL_STATUSES = ["pending", "converting", "verifying", "fact_checking", "key_phrases", "questions"];

export function pipelineStallTimeoutMs() {
  const configured = Number(process.env.PIPELINE_STALL_TIMEOUT_MS || DEFAULT_PIPELINE_STALL_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_PIPELINE_STALL_TIMEOUT_MS;
}

export function isPipelineStalled(lastActivityAt: Date, now = new Date(), timeoutMs = pipelineStallTimeoutMs()) {
  return now.getTime() - lastActivityAt.getTime() >= timeoutMs;
}

/** Converts work abandoned by a serverless timeout into a terminal job state. */
export async function recoverStalledJob(jobId: string, ownerTokenHash: string, now = new Date()) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, ownerTokenHash },
    select: {
      id: true,
      status: true,
      createdAt: true,
      levelVersions: { select: { status: true } },
      events: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  if (!job || !["pending", "processing"].includes(job.status)) return false;

  const lastActivityAt = job.events[0]?.createdAt ?? job.createdAt;
  if (!isPipelineStalled(lastActivityAt, now)) return false;

  const completedCount = job.levelVersions.filter((level) => level.status === "completed").length;
  const failedCount = job.levelVersions.filter((level) => level.status === "failed").length;
  const abandonedCount = job.levelVersions.length - completedCount - failedCount;
  if (abandonedCount === 0) return false;

  const status = completedCount > 0 ? "partially_failed" : "failed";
  const detail: Prisma.InputJsonValue = {
    reason: "pipeline_stalled",
    timeoutMs: pipelineStallTimeoutMs(),
    lastActivityAt: lastActivityAt.toISOString(),
    abandonedCount,
  };

  await prisma.$transaction([
    prisma.levelVersion.updateMany({
      where: { jobId, status: { in: ACTIVE_LEVEL_STATUSES } },
      data: { status: "failed" },
    }),
    prisma.job.update({ where: { id: jobId }, data: { status, completedAt: now } }),
    prisma.jobEvent.create({ data: { jobId, levelCode: null, event: "job_stalled", detail } }),
  ]);

  return true;
}
