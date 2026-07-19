import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const JOB_RETENTION_DAYS = 14;
const RATE_LIMIT_RETENTION_DAYS = 2;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return apiError("UNAUTHORIZED");

  const now = new Date();
  const jobCutoff = new Date(now.getTime() - JOB_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const rateLimitCutoff = new Date(now.getTime() - RATE_LIMIT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const [jobs, rateLimitWindows] = await prisma.$transaction([
    prisma.job.deleteMany({ where: { createdAt: { lt: jobCutoff } } }),
    prisma.rateLimitWindow.deleteMany({ where: { windowStart: { lt: rateLimitCutoff } } }),
  ]);

  return NextResponse.json({ deletedJobs: jobs.count, deletedRateLimitWindows: rateLimitWindows.count, jobCutoff: jobCutoff.toISOString() });
}
