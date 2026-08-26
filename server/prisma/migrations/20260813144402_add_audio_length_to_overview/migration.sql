/*
  Warnings:

  - Added the required column `audioLength` to the `audio_overview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "audio_overview" ADD COLUMN     "audioLength" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "estimatedDuration" INTEGER;

ALTER TABLE "audio_overview" ALTER COLUMN "audioLength" DROP DEFAULT;
