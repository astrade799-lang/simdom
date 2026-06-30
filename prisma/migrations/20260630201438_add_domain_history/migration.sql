-- CreateTable
CREATE TABLE "DomainHistory" (
    "id" TEXT NOT NULL,
    "webAppId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomainHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DomainHistory_webAppId_idx" ON "DomainHistory"("webAppId");

-- CreateIndex
CREATE INDEX "DomainHistory_createdAt_idx" ON "DomainHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "DomainHistory" ADD CONSTRAINT "DomainHistory_webAppId_fkey" FOREIGN KEY ("webAppId") REFERENCES "WebApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
