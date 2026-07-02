-- CreateEnum
CREATE TYPE "AuditGrade" AS ENUM ('BAIK', 'SEDANG', 'BURUK', 'BELUM_CEK');

-- CreateTable
CREATE TABLE "TechnicalAudit" (
    "id" TEXT NOT NULL,
    "webAppId" TEXT NOT NULL,
    "checkedById" TEXT NOT NULL,
    "checkedByName" TEXT NOT NULL,
    "performanceGrade" "AuditGrade" NOT NULL DEFAULT 'BELUM_CEK',
    "performanceScore" INTEGER,
    "performanceLink" TEXT,
    "securityGrade" "AuditGrade" NOT NULL DEFAULT 'BELUM_CEK',
    "securityScore" TEXT,
    "securityLink" TEXT,
    "dnsGrade" "AuditGrade" NOT NULL DEFAULT 'BELUM_CEK',
    "dnsStatus" TEXT,
    "dnsLink" TEXT,
    "teknologi" TEXT,
    "catatanUmum" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicalAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TechnicalAudit_webAppId_idx" ON "TechnicalAudit"("webAppId");

-- CreateIndex
CREATE INDEX "TechnicalAudit_checkedAt_idx" ON "TechnicalAudit"("checkedAt");

-- AddForeignKey
ALTER TABLE "TechnicalAudit" ADD CONSTRAINT "TechnicalAudit_webAppId_fkey" FOREIGN KEY ("webAppId") REFERENCES "WebApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
