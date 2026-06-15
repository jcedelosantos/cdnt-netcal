-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "emailVerified" DATETIME,
    "image" TEXT,
    "empresaNombre" TEXT,
    "empresaRNC" TEXT,
    "empresaTelefono" TEXT,
    "empresaDireccion" TEXT,
    "empresaEmail" TEXT,
    "empresaLogo" TEXT,
    "empresaBanco" TEXT,
    "empresaCuenta" TEXT,
    "empresaTipoCuenta" TEXT,
    "empresaNombreCuenta" TEXT,
    "validezCotizacion" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cliente" TEXT,
    "clienteRNC" TEXT,
    "ubicacion" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aprobado" BOOLEAN NOT NULL DEFAULT false,
    "aprobadoEn" DATETIME,
    "numeroCotizacion" TEXT,
    "numeroFactura" TEXT,
    "facturadoEn" DATETIME,
    "estadoPago" TEXT NOT NULL DEFAULT 'pendiente',
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "modoAvanzado" BOOLEAN NOT NULL DEFAULT false,
    "tipoInstalacion" TEXT NOT NULL DEFAULT 'expuesta',
    "tipoCanalización" TEXT NOT NULL DEFAULT 'EMT',
    "categoriaCable" TEXT NOT NULL DEFAULT 'Cat6',
    "distanciaPromedio" REAL NOT NULL DEFAULT 30,
    "reservaCable" REAL NOT NULL DEFAULT 15,
    "reservaMateriales" REAL NOT NULL DEFAULT 10,
    "switchPuertos" INTEGER NOT NULL DEFAULT 24,
    "switchPoE" BOOLEAN NOT NULL DEFAULT false,
    "switchPuertosPoE" INTEGER NOT NULL DEFAULT 0,
    "gabineteRU" INTEGER NOT NULL DEFAULT 12,
    "incluyeUPS" BOOLEAN NOT NULL DEFAULT false,
    "incluyeCotizacion" BOOLEAN NOT NULL DEFAULT false,
    "margenGanancia" REAL NOT NULL DEFAULT 0,
    "costoManoObra" REAL NOT NULL DEFAULT 0,
    "costoTransporte" REAL NOT NULL DEFAULT 0,
    "costoConfiguracion" REAL NOT NULL DEFAULT 0,
    "costoCertificacion" REAL NOT NULL DEFAULT 0,
    "itbis" REAL NOT NULL DEFAULT 18,
    "notas" TEXT,
    "inventoryClientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_inventoryClientId_fkey" FOREIGN KEY ("inventoryClientId") REFERENCES "InventoryClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "distancia" REAL NOT NULL DEFAULT 30,
    CONSTRAINT "ProjectPoint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL DEFAULT 'Pago',
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" TEXT,
    "referencia" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pago_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" REAL NOT NULL DEFAULT 0,
    "unidad" TEXT NOT NULL DEFAULT 'und',
    "precioUnit" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "esPersonalizado" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ProjectMaterial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryEquipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "direccionIp" TEXT,
    "fabricante" TEXT,
    "direccionMac" TEXT,
    "comentarios" TEXT,
    "tipoEquipo" TEXT DEFAULT 'otro',
    "numeroSerie" TEXT,
    "fechaCompra" DATETIME,
    "garantia" DATETIME,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "responsable" TEXT,
    "costoUsd" REAL DEFAULT 0,
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryEquipment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryLicense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "proveedor" TEXT,
    "fechaInicio" DATETIME,
    "fechaVencimiento" DATETIME,
    "costoAnual" REAL NOT NULL DEFAULT 0,
    "responsable" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "notas" TEXT,
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryLicense_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryMonthlyConsumption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "costoMensual" REAL NOT NULL DEFAULT 0,
    "responsable" TEXT,
    "proveedor" TEXT,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryMonthlyConsumption_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryThirdPartySupport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "servicios" TEXT,
    "costoMensual" REAL NOT NULL DEFAULT 0,
    "costoAnual" REAL NOT NULL DEFAULT 0,
    "contrato" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryThirdPartySupport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryITProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'en_progreso',
    "responsable" TEXT,
    "presupuesto" REAL NOT NULL DEFAULT 0,
    "avance" INTEGER NOT NULL DEFAULT 0,
    "fechaInicio" DATETIME,
    "fechaFin" DATETIME,
    "notas" TEXT,
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryITProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TicInventario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "gastoAnual" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TicInventario_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TicCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inventarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "gastoTotal" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "TicCategory_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "TicInventario" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TicArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoriaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "cantidad" REAL NOT NULL DEFAULT 1,
    "precioUnitario" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "fechaVencimiento" DATETIME,
    "proveedor" TEXT,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TicArticle_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "TicCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "severidad" TEXT NOT NULL DEFAULT 'info',
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AutomationSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "frecuencia" TEXT NOT NULL DEFAULT 'weekly',
    "proximaEjecucion" DATETIME,
    "ultimaEjecucion" DATETIME,
    "configuracion" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "referenceId" TEXT,
    "estado" TEXT NOT NULL,
    "mensaje" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Project_inventoryClientId_idx" ON "Project"("inventoryClientId");

-- CreateIndex
CREATE INDEX "ProjectPoint_projectId_idx" ON "ProjectPoint"("projectId");

-- CreateIndex
CREATE INDEX "Pago_projectId_idx" ON "Pago"("projectId");

-- CreateIndex
CREATE INDEX "ProjectMaterial_projectId_idx" ON "ProjectMaterial"("projectId");

-- CreateIndex
CREATE INDEX "InventoryClient_userId_idx" ON "InventoryClient"("userId");

-- CreateIndex
CREATE INDEX "InventoryEquipment_estado_idx" ON "InventoryEquipment"("estado");

-- CreateIndex
CREATE INDEX "InventoryEquipment_tipoEquipo_idx" ON "InventoryEquipment"("tipoEquipo");

-- CreateIndex
CREATE INDEX "InventoryEquipment_clientId_idx" ON "InventoryEquipment"("clientId");

-- CreateIndex
CREATE INDEX "InventoryLicense_estado_idx" ON "InventoryLicense"("estado");

-- CreateIndex
CREATE INDEX "InventoryLicense_clientId_idx" ON "InventoryLicense"("clientId");

-- CreateIndex
CREATE INDEX "InventoryMonthlyConsumption_clientId_idx" ON "InventoryMonthlyConsumption"("clientId");

-- CreateIndex
CREATE INDEX "InventoryThirdPartySupport_clientId_idx" ON "InventoryThirdPartySupport"("clientId");

-- CreateIndex
CREATE INDEX "InventoryITProject_estado_idx" ON "InventoryITProject"("estado");

-- CreateIndex
CREATE INDEX "InventoryITProject_clientId_idx" ON "InventoryITProject"("clientId");

-- CreateIndex
CREATE INDEX "TicInventario_userId_idx" ON "TicInventario"("userId");

-- CreateIndex
CREATE INDEX "TicInventario_clientId_idx" ON "TicInventario"("clientId");

-- CreateIndex
CREATE INDEX "TicInventario_estado_idx" ON "TicInventario"("estado");

-- CreateIndex
CREATE INDEX "TicCategory_inventarioId_idx" ON "TicCategory"("inventarioId");

-- CreateIndex
CREATE INDEX "TicArticle_categoriaId_idx" ON "TicArticle"("categoriaId");

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");

-- CreateIndex
CREATE INDEX "Alert_leido_idx" ON "Alert"("leido");

-- CreateIndex
CREATE INDEX "Alert_severidad_idx" ON "Alert"("severidad");

-- CreateIndex
CREATE INDEX "AutomationSchedule_userId_idx" ON "AutomationSchedule"("userId");

-- CreateIndex
CREATE INDEX "AutomationSchedule_activo_idx" ON "AutomationSchedule"("activo");

-- CreateIndex
CREATE INDEX "AlertLog_userId_idx" ON "AlertLog"("userId");

-- CreateIndex
CREATE INDEX "AlertLog_estado_idx" ON "AlertLog"("estado");

-- CreateIndex
CREATE INDEX "AlertLog_createdAt_idx" ON "AlertLog"("createdAt");
