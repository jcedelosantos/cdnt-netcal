-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "origen" TEXT NOT NULL DEFAULT 'interno';

-- CreateTable
CREATE TABLE "EstimadorConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "margen" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "rangoPct" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "manoObraPorCamara" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoFijo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "itbis" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimadorConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimadorMaterial" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "materialNombre" TEXT NOT NULL,
    "referenciaNombre" TEXT,
    "incluir" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "EstimadorMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EstimadorConfig_userId_key" ON "EstimadorConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EstimadorMaterial_configId_materialNombre_key" ON "EstimadorMaterial"("configId", "materialNombre");

-- CreateIndex
CREATE INDEX "Project_origen_idx" ON "Project"("origen");

-- AddForeignKey
ALTER TABLE "EstimadorConfig" ADD CONSTRAINT "EstimadorConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimadorMaterial" ADD CONSTRAINT "EstimadorMaterial_configId_fkey" FOREIGN KEY ("configId") REFERENCES "EstimadorConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

