-- CreateTable
CREATE TABLE "DomainCheck" (
    "id" TEXT NOT NULL,
    "webAppId" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL,
    "responseTime" INTEGER,
    "statusCode" INTEGER,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DomainCheck_webAppId_idx" ON "DomainCheck"("webAppId");

-- CreateIndex
CREATE INDEX "DomainCheck_checkedAt_idx" ON "DomainCheck"("checkedAt");

-- AddForeignKey
ALTER TABLE "DomainCheck" ADD CONSTRAINT "DomainCheck_webAppId_fkey" FOREIGN KEY ("webAppId") REFERENCES "WebApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
