-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "emailVerified" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
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

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cliente" TEXT,
    "clienteRNC" TEXT,
    "ubicacion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aprobado" BOOLEAN NOT NULL DEFAULT false,
    "aprobadoEn" TIMESTAMP(3),
    "numeroCotizacion" TEXT,
    "numeroFactura" TEXT,
    "facturadoEn" TIMESTAMP(3),
    "estadoPago" TEXT NOT NULL DEFAULT 'pendiente',
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "modoAvanzado" BOOLEAN NOT NULL DEFAULT false,
    "tipoInstalacion" TEXT NOT NULL DEFAULT 'expuesta',
    "tipoCanalización" TEXT NOT NULL DEFAULT 'EMT',
    "categoriaCable" TEXT NOT NULL DEFAULT 'Cat6',
    "distanciaPromedio" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "reservaCable" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "reservaMateriales" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "switchPuertos" INTEGER NOT NULL DEFAULT 24,
    "switchPoE" BOOLEAN NOT NULL DEFAULT false,
    "switchPuertosPoE" INTEGER NOT NULL DEFAULT 0,
    "gabineteRU" INTEGER NOT NULL DEFAULT 12,
    "incluyeUPS" BOOLEAN NOT NULL DEFAULT false,
    "incluyeCotizacion" BOOLEAN NOT NULL DEFAULT false,
    "margenGanancia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoManoObra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoTransporte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoConfiguracion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoCertificacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "itbis" DOUBLE PRECISION NOT NULL DEFAULT 18,
    "notas" TEXT,
    "inventoryClientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPoint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "distancia" DOUBLE PRECISION NOT NULL DEFAULT 30,

    CONSTRAINT "ProjectPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "concepto" TEXT NOT NULL DEFAULT 'Pago',
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" TEXT,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMaterial" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unidad" TEXT NOT NULL DEFAULT 'und',
    "precioUnit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "esPersonalizado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ProjectMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryClient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryEquipment" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccionIp" TEXT,
    "fabricante" TEXT,
    "direccionMac" TEXT,
    "comentarios" TEXT,
    "tipoEquipo" TEXT DEFAULT 'otro',
    "numeroSerie" TEXT,
    "fechaCompra" TIMESTAMP(3),
    "garantia" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "responsable" TEXT,
    "costoUsd" DOUBLE PRECISION DEFAULT 0,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLicense" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "proveedor" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "costoAnual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "responsable" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activa',
    "notas" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMonthlyConsumption" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "costoMensual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "responsable" TEXT,
    "proveedor" TEXT,
    "notas" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryMonthlyConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryThirdPartySupport" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "servicios" TEXT,
    "costoMensual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoAnual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contrato" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryThirdPartySupport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryITProject" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'en_progreso',
    "responsable" TEXT,
    "presupuesto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avance" INTEGER NOT NULL DEFAULT 0,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "notas" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryITProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicInventario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "fecha" TIMESTAMP(3),
    "gastoAnual" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicInventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicCategory" (
    "id" TEXT NOT NULL,
    "inventarioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "gastoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "TicCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicArticle" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "cantidad" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "precioUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaVencimiento" TIMESTAMP(3),
    "proveedor" TEXT,
    "responsable" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TecnicoRol" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tarifaDiaria" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TecnicoRol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tecnico" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "foto" TEXT,
    "rolId" TEXT,
    "especialidades" TEXT,
    "tarifaDiaria" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tarifaHora" DOUBLE PRECISION,
    "tarifaHoraExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaIngreso" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "tipoContratacion" TEXT NOT NULL DEFAULT 'fijo',
    "datosBancarios" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoAsignacion" (
    "id" TEXT NOT NULL,
    "tecnicoId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rolId" TEXT,
    "rolNombre" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "diasProgramados" INTEGER NOT NULL DEFAULT 0,
    "tarifaDiaria" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tarifaHoraExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonificacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viaticos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transporte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alimentacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anticipo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "responsableAuth" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProyectoAsignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jornada" (
    "id" TEXT NOT NULL,
    "tecnicoId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "asignacionId" TEXT,
    "userId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "diasTrabajados" INTEGER NOT NULL DEFAULT 1,
    "fechasIndividuales" TEXT,
    "horaEntrada" TEXT,
    "horaSalida" TEXT,
    "horasTotales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tipoJornada" TEXT NOT NULL DEFAULT 'completa',
    "tarifaDia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tarifaHoraExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonificacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viaticos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transporte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alimentacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalJornada" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actividades" TEXT,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'programado',
    "aprobadoPor" TEXT,
    "periodoPagoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jornada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodoPago" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'semanal',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "totalBruto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDescuentos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAnticipos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalNeto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "fechaPago" TIMESTAMP(3),
    "metodoPago" TEXT,
    "referencia" TEXT,
    "aprobadoPor" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodoPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetallePago" (
    "id" TEXT NOT NULL,
    "periodoPagoId" TEXT NOT NULL,
    "tecnicoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "diasTrabajados" INTEGER NOT NULL DEFAULT 0,
    "horasNormales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasExtra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "salarioBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bonificaciones" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viaticos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "transporte" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alimentacion" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otrosIngresos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descuentos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "anticipos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pagoBruto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pagoNeto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "metodoPago" TEXT,
    "referencia" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetallePago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anticipo" (
    "id" TEXT NOT NULL,
    "tecnicoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "metodoPago" TEXT,
    "referencia" TEXT,
    "autorizadoPor" TEXT,
    "periodoPagoId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anticipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recibo" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "periodoPagoId" TEXT,
    "detallePagoId" TEXT,
    "tecnicoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contenido" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "firmadoEn" TIMESTAMP(3),
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "severidad" TEXT NOT NULL DEFAULT 'info',
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "frecuencia" TEXT NOT NULL DEFAULT 'weekly',
    "proximaEjecucion" TIMESTAMP(3),
    "ultimaEjecucion" TIMESTAMP(3),
    "configuracion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "referenceId" TEXT,
    "estado" TEXT NOT NULL,
    "mensaje" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrecioReferencia" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "suplidor" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'und',
    "fuente" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrecioReferencia_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "TecnicoRol_userId_idx" ON "TecnicoRol"("userId");

-- CreateIndex
CREATE INDEX "Tecnico_userId_idx" ON "Tecnico"("userId");

-- CreateIndex
CREATE INDEX "Tecnico_estado_idx" ON "Tecnico"("estado");

-- CreateIndex
CREATE INDEX "ProyectoAsignacion_tecnicoId_idx" ON "ProyectoAsignacion"("tecnicoId");

-- CreateIndex
CREATE INDEX "ProyectoAsignacion_projectId_idx" ON "ProyectoAsignacion"("projectId");

-- CreateIndex
CREATE INDEX "ProyectoAsignacion_userId_idx" ON "ProyectoAsignacion"("userId");

-- CreateIndex
CREATE INDEX "Jornada_tecnicoId_idx" ON "Jornada"("tecnicoId");

-- CreateIndex
CREATE INDEX "Jornada_projectId_idx" ON "Jornada"("projectId");

-- CreateIndex
CREATE INDEX "Jornada_userId_idx" ON "Jornada"("userId");

-- CreateIndex
CREATE INDEX "Jornada_fecha_idx" ON "Jornada"("fecha");

-- CreateIndex
CREATE INDEX "Jornada_estado_idx" ON "Jornada"("estado");

-- CreateIndex
CREATE INDEX "Jornada_periodoPagoId_idx" ON "Jornada"("periodoPagoId");

-- CreateIndex
CREATE UNIQUE INDEX "Jornada_tecnicoId_projectId_fecha_key" ON "Jornada"("tecnicoId", "projectId", "fecha");

-- CreateIndex
CREATE INDEX "PeriodoPago_userId_idx" ON "PeriodoPago"("userId");

-- CreateIndex
CREATE INDEX "PeriodoPago_estado_idx" ON "PeriodoPago"("estado");

-- CreateIndex
CREATE INDEX "DetallePago_periodoPagoId_idx" ON "DetallePago"("periodoPagoId");

-- CreateIndex
CREATE INDEX "DetallePago_tecnicoId_idx" ON "DetallePago"("tecnicoId");

-- CreateIndex
CREATE INDEX "DetallePago_userId_idx" ON "DetallePago"("userId");

-- CreateIndex
CREATE INDEX "Anticipo_tecnicoId_idx" ON "Anticipo"("tecnicoId");

-- CreateIndex
CREATE INDEX "Anticipo_userId_idx" ON "Anticipo"("userId");

-- CreateIndex
CREATE INDEX "Anticipo_estado_idx" ON "Anticipo"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Recibo_numero_key" ON "Recibo"("numero");

-- CreateIndex
CREATE INDEX "Recibo_tecnicoId_idx" ON "Recibo"("tecnicoId");

-- CreateIndex
CREATE INDEX "Recibo_userId_idx" ON "Recibo"("userId");

-- CreateIndex
CREATE INDEX "Recibo_estado_idx" ON "Recibo"("estado");

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

-- CreateIndex
CREATE INDEX "PrecioReferencia_userId_idx" ON "PrecioReferencia"("userId");

-- CreateIndex
CREATE INDEX "PrecioReferencia_nombre_idx" ON "PrecioReferencia"("nombre");

-- CreateIndex
CREATE INDEX "PrecioReferencia_fecha_idx" ON "PrecioReferencia"("fecha");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_inventoryClientId_fkey" FOREIGN KEY ("inventoryClientId") REFERENCES "InventoryClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPoint" ADD CONSTRAINT "ProjectPoint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMaterial" ADD CONSTRAINT "ProjectMaterial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryEquipment" ADD CONSTRAINT "InventoryEquipment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLicense" ADD CONSTRAINT "InventoryLicense_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMonthlyConsumption" ADD CONSTRAINT "InventoryMonthlyConsumption_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryThirdPartySupport" ADD CONSTRAINT "InventoryThirdPartySupport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryITProject" ADD CONSTRAINT "InventoryITProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicInventario" ADD CONSTRAINT "TicInventario_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "InventoryClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicCategory" ADD CONSTRAINT "TicCategory_inventarioId_fkey" FOREIGN KEY ("inventarioId") REFERENCES "TicInventario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicArticle" ADD CONSTRAINT "TicArticle_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "TicCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tecnico" ADD CONSTRAINT "Tecnico_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "TecnicoRol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoAsignacion" ADD CONSTRAINT "ProyectoAsignacion_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoAsignacion" ADD CONSTRAINT "ProyectoAsignacion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoAsignacion" ADD CONSTRAINT "ProyectoAsignacion_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "TecnicoRol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jornada" ADD CONSTRAINT "Jornada_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jornada" ADD CONSTRAINT "Jornada_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jornada" ADD CONSTRAINT "Jornada_asignacionId_fkey" FOREIGN KEY ("asignacionId") REFERENCES "ProyectoAsignacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jornada" ADD CONSTRAINT "Jornada_periodoPagoId_fkey" FOREIGN KEY ("periodoPagoId") REFERENCES "PeriodoPago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePago" ADD CONSTRAINT "DetallePago_periodoPagoId_fkey" FOREIGN KEY ("periodoPagoId") REFERENCES "PeriodoPago"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anticipo" ADD CONSTRAINT "Anticipo_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "Tecnico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recibo" ADD CONSTRAINT "Recibo_periodoPagoId_fkey" FOREIGN KEY ("periodoPagoId") REFERENCES "PeriodoPago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrecioReferencia" ADD CONSTRAINT "PrecioReferencia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

