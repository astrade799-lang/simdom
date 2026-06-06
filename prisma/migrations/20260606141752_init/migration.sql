-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'KABID');

-- CreateEnum
CREATE TYPE "WebStatus" AS ENUM ('AKTIF', 'TIDAK_AKTIF', 'SUSPEND');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PENDING', 'CONFIRMED', 'INSTRUCTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "skpdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skpd" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "singkatan" TEXT NOT NULL,
    "penanggungjawab" TEXT NOT NULL,
    "kontak" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skpd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebApp" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" "WebStatus" NOT NULL DEFAULT 'AKTIF',
    "alasanSuspend" TEXT,
    "adminTeknis" TEXT NOT NULL,
    "kontakAdmin" TEXT NOT NULL,
    "vendor" TEXT,
    "kontakVendor" TEXT,
    "platform" TEXT,
    "tanggalAktif" TIMESTAMP(3),
    "tanggalExpired" TIMESTAMP(3),
    "skpdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityReport" (
    "id" TEXT NOT NULL,
    "jenisKegiatan" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'PENDING',
    "instruksi" TEXT,
    "webAppId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "confirmedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_skpdId_idx" ON "User"("skpdId");

-- CreateIndex
CREATE UNIQUE INDEX "Skpd_singkatan_key" ON "Skpd"("singkatan");

-- CreateIndex
CREATE UNIQUE INDEX "WebApp_url_key" ON "WebApp"("url");

-- CreateIndex
CREATE INDEX "WebApp_skpdId_idx" ON "WebApp"("skpdId");

-- CreateIndex
CREATE INDEX "WebApp_status_idx" ON "WebApp"("status");

-- CreateIndex
CREATE INDEX "ActivityReport_webAppId_idx" ON "ActivityReport"("webAppId");

-- CreateIndex
CREATE INDEX "ActivityReport_status_idx" ON "ActivityReport"("status");

-- CreateIndex
CREATE INDEX "ActivityReport_tanggal_idx" ON "ActivityReport"("tanggal");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_skpdId_fkey" FOREIGN KEY ("skpdId") REFERENCES "Skpd"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebApp" ADD CONSTRAINT "WebApp_skpdId_fkey" FOREIGN KEY ("skpdId") REFERENCES "Skpd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityReport" ADD CONSTRAINT "ActivityReport_webAppId_fkey" FOREIGN KEY ("webAppId") REFERENCES "WebApp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
