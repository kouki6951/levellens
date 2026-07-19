import { prisma } from "@/lib/db";
import { ownerTokenHashForRequest } from "@/lib/api/ownership";

export async function GET(request: Request) {
  const ownerTokenHash = ownerTokenHashForRequest(request);
  if (!ownerTokenHash) return Response.json([]);
  const jobs = await prisma.job.findMany({
    where: { ownerTokenHash },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { levelVersions: { select: { status: true, levelCode: true, levelLabel: true } } },
  });
  return Response.json(jobs.map((job) => ({
    id: job.id,
    sourceTitle: job.sourceTitle,
    sourceUrl: job.sourceUrl,
    sourceText: job.sourceText,
    lang: job.lang,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    completedLevels: job.levelVersions.filter((level) => level.status === "completed").length,
    levelCount: job.levelVersions.length,
    levelCodes: job.levelVersions.map((level) => level.levelCode),
    levels: job.levelVersions.map((level) => ({ levelCode: level.levelCode, levelLabel: level.levelLabel, status: level.status })),
  })));
}
