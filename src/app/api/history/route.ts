import { prisma } from "@/lib/db";

export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { levelVersions: { select: { status: true } } },
  });
  return Response.json(jobs.map((job) => ({
    id: job.id,
    sourceTitle: job.sourceTitle,
    sourceText: job.sourceText,
    lang: job.lang,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    completedLevels: job.levelVersions.filter((level) => level.status === "completed").length,
    levelCount: job.levelVersions.length,
  })));
}
