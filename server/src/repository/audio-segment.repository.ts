import { prisma } from "../lib/db";

export const audioSegmentRepository = {
  createMany(
    audioOverviewId: string,
    segments: Array<{
      order: number;
      speaker: string;
      text: string;
      startTime: number;
      endTime: number;
      topic: string;
      sourceRefs?: Array<{
        chunkId: string;
        sourceId: string;
        sourceTitle: string;
        snippet: string;
      }>;
    }>
  ) {
    return prisma.audioSegment.createMany({
      data: segments.map((s) => ({
        audioOverviewId,
        order: s.order,
        speaker: s.speaker,
        text: s.text,
        startTime: s.startTime,
        endTime: s.endTime,
        topic: s.topic,
        sourceRefs: s.sourceRefs ?? undefined,
      })),
    });
  },

  findByOverviewId(audioOverviewId: string) {
    return prisma.audioSegment.findMany({
      where: { audioOverviewId },
      orderBy: { order: "asc" },
    });
  },

  findById(id: string) {
    return prisma.audioSegment.findUnique({ where: { id } });
  },

  findActiveSegment(audioOverviewId: string, currentTime: number) {
    return prisma.audioSegment.findFirst({
      where: {
        audioOverviewId,
        startTime: { lte: currentTime },
        endTime: { gte: currentTime },
      },
    });
  },

  deleteByOverviewId(audioOverviewId: string) {
    return prisma.audioSegment.deleteMany({
      where: { audioOverviewId },
    });
  },
};
