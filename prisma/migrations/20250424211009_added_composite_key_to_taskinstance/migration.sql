/*
  Warnings:

  - A unique constraint covering the columns `[habitId,scheduledAt]` on the table `TaskInstance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TaskInstance_habitId_scheduledAt_key" ON "TaskInstance"("habitId", "scheduledAt");
