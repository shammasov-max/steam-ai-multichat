-- CreateEnum
CREATE TYPE "DialogStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'ERROR');

-- CreateTable
CREATE TABLE "Dialog" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" "DialogStatus" NOT NULL DEFAULT 'ACTIVE',
    "language" TEXT NOT NULL,
    "userInfo" JSONB,
    "goal" TEXT NOT NULL,
    "completionCriteria" JSONB NOT NULL,
    "negotiationSettings" JSONB,
    "referenceContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dialog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "dialogId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "content" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DialogState" (
    "id" TEXT NOT NULL,
    "dialogId" TEXT NOT NULL,
    "continuationScore" DOUBLE PRECISION NOT NULL,
    "compressedContext" TEXT,
    "currentStrategy" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "goalProgress" DOUBLE PRECISION NOT NULL,
    "issuesDetected" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DialogState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "dialogId" TEXT,
    "messageId" TEXT,
    "botId" TEXT,
    "userId" TEXT,
    "level" "LogLevel" NOT NULL,
    "data" JSONB,
    "text" TEXT,
    "fullJson" JSONB,
    "datetime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dialog_externalId_key" ON "Dialog"("externalId");

-- CreateIndex
CREATE INDEX "Dialog_externalId_idx" ON "Dialog"("externalId");

-- CreateIndex
CREATE INDEX "Message_dialogId_createdAt_idx" ON "Message"("dialogId", "createdAt");

-- CreateIndex
CREATE INDEX "DialogState_dialogId_idx" ON "DialogState"("dialogId");

-- CreateIndex
CREATE INDEX "Log_dialogId_idx" ON "Log"("dialogId");

-- CreateIndex
CREATE INDEX "Log_datetime_idx" ON "Log"("datetime");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "Dialog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DialogState" ADD CONSTRAINT "DialogState_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "Dialog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_dialogId_fkey" FOREIGN KEY ("dialogId") REFERENCES "Dialog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
